import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { prisma } from "./prisma";
import { createNotification } from "./notifications";

// Every tool acts as the user who owns the MCP token (ctx.http.authInfo.extra).
// Deliberately excluded: user management, password/credential access, deletes.

const userSelect = { id: true, name: true, email: true } as const;

const TASK_STATUS = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
const PRIORITY = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const ACTIVITY_STATUS = ["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
const RESEARCH_TYPE = ["PAPER", "ARTICLE", "REPO", "TOOL", "VIDEO", "OTHER"] as const;
const RELEVANCE = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

type ToolContext = { http?: { authInfo?: { extra?: Record<string, unknown> } } };

function requireUser(ctx: ToolContext): { id: string; name: string } {
  const extra = ctx.http?.authInfo?.extra;
  const id = typeof extra?.userId === "string" ? extra.userId : null;
  if (!id) throw new Error("Token sin usuario asociado.");
  const name = typeof extra?.userName === "string" ? extra.userName : "MCP";
  return { id, name };
}

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function parseDate(value: string, field: string): Date {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`Fecha inválida en "${field}": ${value}. Usá formato ISO (YYYY-MM-DD).`);
  }
  return date;
}

async function logMcpActivity(
  action: string,
  entityType: string,
  entityId: string,
  entityTitle: string,
  user: { id: string; name: string }
) {
  await prisma.activityLog.create({
    data: {
      action,
      entityType,
      entityId,
      entityTitle,
      userId: user.id,
      userName: user.name,
      metadata: { via: "mcp" },
    },
  });
}

export function registerTools(server: McpServer) {
  server.registerTool(
    "get_project_overview",
    {
      title: "Resumen del proyecto",
      description:
        "Estado general de la tesis: fases con progreso, hitos de entrega (milestones), conteo de tareas por estado, actividades WBS y próximos vencimientos.",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const soon = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
      const [phases, taskCounts, activityCounts, upcomingMilestones, upcomingTasks] =
        await Promise.all([
          prisma.phase.findMany({
            orderBy: { number: "asc" },
            include: { milestones: { orderBy: { dueDate: "asc" } } },
          }),
          prisma.task.groupBy({ by: ["status"], _count: { _all: true } }),
          prisma.activity.groupBy({ by: ["status"], _count: { _all: true } }),
          prisma.milestone.findMany({
            where: { dueDate: { lte: soon }, status: { not: "COMPLETED" } },
            orderBy: { dueDate: "asc" },
            include: { phase: { select: { number: true, name: true } } },
          }),
          prisma.task.findMany({
            where: { dueDate: { lte: soon }, status: { not: "DONE" } },
            orderBy: { dueDate: "asc" },
            take: 15,
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              assignees: { select: userSelect },
            },
          }),
        ]);

      return ok({
        phases,
        tasksByStatus: Object.fromEntries(
          taskCounts.map((c) => [c.status, c._count._all])
        ),
        activitiesByStatus: Object.fromEntries(
          activityCounts.map((c) => [c.status, c._count._all])
        ),
        upcomingMilestones,
        upcomingTasks,
      });
    }
  );

  server.registerTool(
    "search",
    {
      title: "Búsqueda global",
      description:
        "Busca en tareas, research, experimentos, decisiones, minutas y recursos por texto.",
      inputSchema: z.object({
        query: z.string().min(2).describe("Texto a buscar (mínimo 2 caracteres)"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ query }) => {
      const q = query.trim();
      const insensitive = "insensitive" as const;
      const [tasks, research, experiments, decisions, meetings, resources] =
        await Promise.all([
          prisma.task.findMany({
            where: {
              OR: [
                { title: { contains: q, mode: insensitive } },
                { description: { contains: q, mode: insensitive } },
              ],
            },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              assignees: { select: userSelect },
            },
            take: 8,
          }),
          prisma.researchEntry.findMany({
            where: {
              OR: [
                { title: { contains: q, mode: insensitive } },
                { summary: { contains: q, mode: insensitive } },
                { keyFindings: { contains: q, mode: insensitive } },
              ],
            },
            select: { id: true, title: true, type: true, relevance: true, url: true },
            take: 8,
          }),
          prisma.experiment.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: insensitive } },
                { hypothesis: { contains: q, mode: insensitive } },
              ],
            },
            select: { id: true, name: true, status: true, architecture: true },
            take: 8,
          }),
          prisma.decision.findMany({
            where: {
              OR: [
                { title: { contains: q, mode: insensitive } },
                { decision: { contains: q, mode: insensitive } },
                { rationale: { contains: q, mode: insensitive } },
              ],
            },
            select: { id: true, title: true, status: true, createdAt: true },
            take: 8,
          }),
          prisma.meetingNote.findMany({
            where: {
              OR: [
                { title: { contains: q, mode: insensitive } },
                { summary: { contains: q, mode: insensitive } },
              ],
            },
            select: { id: true, title: true, date: true, type: true },
            take: 8,
          }),
          prisma.resource.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: insensitive } },
                { description: { contains: q, mode: insensitive } },
              ],
            },
            select: { id: true, name: true, category: true, url: true },
            take: 8,
          }),
        ]);

      return ok({ tasks, research, experiments, decisions, meetings, resources });
    }
  );

  server.registerTool(
    "list_tasks",
    {
      title: "Listar tareas",
      description: "Lista tareas con filtros por estado, asignado, fase o texto.",
      inputSchema: z.object({
        status: z.enum(TASK_STATUS).optional().describe("Filtrar por estado"),
        assigneeEmail: z.string().optional().describe("Email del asignado"),
        phaseNumber: z.number().int().optional().describe("Número de fase (1, 2, ...)"),
        limit: z.number().int().min(1).max(100).optional().describe("Máximo de resultados (default 50)"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ status, assigneeEmail, phaseNumber, limit }) => {
      const tasks = await prisma.task.findMany({
        where: {
          ...(status && { status }),
          ...(assigneeEmail && { assignees: { some: { email: assigneeEmail } } }),
          ...(phaseNumber !== undefined && { phase: { number: phaseNumber } }),
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          wbsCode: true,
          assignees: { select: userSelect },
          phase: { select: { number: true, name: true } },
          activity: { select: { wbsCode: true, name: true } },
          tags: { select: { name: true } },
          updatedAt: true,
        },
        orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
        take: limit ?? 50,
      });
      return ok(tasks);
    }
  );

  server.registerTool(
    "create_task",
    {
      title: "Crear tarea",
      description:
        "Crea una tarea. El creador es el dueño del token. Los asignados reciben notificación in-app.",
      inputSchema: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(PRIORITY).optional().describe("Default MEDIUM"),
        dueDate: z.string().optional().describe("Fecha límite ISO (YYYY-MM-DD)"),
        phaseNumber: z.number().int().optional().describe("Número de fase"),
        assigneeEmails: z.array(z.string()).optional().describe("Emails de los asignados"),
      }),
    },
    async ({ title, description, priority, dueDate, phaseNumber, assigneeEmails }, ctx) => {
      const user = requireUser(ctx as ToolContext);

      let phaseId: string | undefined;
      if (phaseNumber !== undefined) {
        const phase = await prisma.phase.findFirst({ where: { number: phaseNumber } });
        if (!phase) throw new Error(`No existe la fase ${phaseNumber}.`);
        phaseId = phase.id;
      }

      let assigneeIds: string[] = [];
      if (assigneeEmails?.length) {
        const users = await prisma.user.findMany({
          where: { email: { in: assigneeEmails } },
          select: userSelect,
        });
        const missing = assigneeEmails.filter(
          (e) => !users.some((u) => u.email === e)
        );
        if (missing.length) {
          throw new Error(`Usuarios no encontrados: ${missing.join(", ")}`);
        }
        assigneeIds = users.map((u) => u.id);
      }

      const task = await prisma.task.create({
        data: {
          title,
          description,
          priority: priority ?? "MEDIUM",
          dueDate: dueDate ? parseDate(dueDate, "dueDate") : undefined,
          creatorId: user.id,
          phaseId,
          assignees: assigneeIds.length
            ? { connect: assigneeIds.map((id) => ({ id })) }
            : undefined,
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignees: { select: userSelect },
        },
      });

      await logMcpActivity("created_task", "task", task.id, task.title, user);
      for (const assigneeId of assigneeIds) {
        if (assigneeId === user.id) continue;
        createNotification({
          userId: assigneeId,
          type: "task_assigned",
          title: "Tarea asignada",
          message: `Te asignaron: ${title}`,
          entityType: "task",
          entityId: task.id,
        }).catch(() => {});
      }

      return ok(task);
    }
  );

  server.registerTool(
    "update_task",
    {
      title: "Actualizar tarea",
      description: "Actualiza título, descripción, estado, prioridad o fecha límite de una tarea.",
      inputSchema: z.object({
        taskId: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(TASK_STATUS).optional(),
        priority: z.enum(PRIORITY).optional(),
        dueDate: z.string().nullable().optional().describe("Fecha ISO, o null para quitarla"),
      }),
    },
    async ({ taskId, title, description, status, priority, dueDate }, ctx) => {
      const user = requireUser(ctx as ToolContext);

      const existing = await prisma.task.findUnique({ where: { id: taskId } });
      if (!existing) throw new Error("Tarea no encontrada.");

      const task = await prisma.task.update({
        where: { id: taskId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status }),
          ...(priority !== undefined && { priority }),
          ...(dueDate !== undefined && {
            dueDate: dueDate === null ? null : parseDate(dueDate, "dueDate"),
          }),
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignees: { select: userSelect },
        },
      });

      await logMcpActivity("updated_task", "task", task.id, task.title, user);
      return ok(task);
    }
  );

  server.registerTool(
    "list_activities",
    {
      title: "Listar hitos (WBS)",
      description:
        "Lista las actividades/hitos del WBS con criterios de aceptación, entregables y tareas vinculadas.",
      inputSchema: z.object({
        status: z.enum(ACTIVITY_STATUS).optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ status }) => {
      const activities = await prisma.activity.findMany({
        where: status ? { status } : undefined,
        orderBy: { wbsCode: "asc" },
        select: {
          id: true,
          wbsCode: true,
          name: true,
          description: true,
          status: true,
          startDate: true,
          endDate: true,
          phase: { select: { number: true, name: true } },
          owners: { select: userSelect },
          acceptanceCriteria: {
            select: { text: true, done: true },
            orderBy: { order: "asc" },
          },
          deliverables: { select: { title: true, fileUrl: true } },
          tasks: { select: { id: true, title: true, status: true } },
        },
      });
      return ok(activities);
    }
  );

  server.registerTool(
    "list_research",
    {
      title: "Listar research",
      description: "Lista entradas de investigación (papers, artículos, repos, etc.).",
      inputSchema: z.object({
        relevance: z.enum(RELEVANCE).optional(),
        limit: z.number().int().min(1).max(100).optional().describe("Default 30"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ relevance, limit }) => {
      const entries = await prisma.researchEntry.findMany({
        where: relevance ? { relevance } : undefined,
        orderBy: { createdAt: "desc" },
        take: limit ?? 30,
        select: {
          id: true,
          title: true,
          type: true,
          url: true,
          authors: true,
          summary: true,
          keyFindings: true,
          relevance: true,
          tags: true,
          user: { select: userSelect },
          createdAt: true,
        },
      });
      return ok(entries);
    }
  );

  server.registerTool(
    "create_research_entry",
    {
      title: "Agregar research",
      description: "Registra una entrada de investigación (paper, artículo, repo, herramienta...).",
      inputSchema: z.object({
        title: z.string().min(1),
        type: z.enum(RESEARCH_TYPE),
        summary: z.string().min(1).describe("Resumen de qué es y por qué importa"),
        url: z.string().optional(),
        authors: z.string().optional(),
        keyFindings: z.string().optional(),
        relevance: z.enum(RELEVANCE).optional().describe("Default MEDIUM"),
        tags: z.array(z.string()).optional(),
      }),
    },
    async ({ title, type, summary, url, authors, keyFindings, relevance, tags }, ctx) => {
      const user = requireUser(ctx as ToolContext);

      const entry = await prisma.researchEntry.create({
        data: {
          title,
          type,
          summary,
          url,
          authors,
          keyFindings,
          relevance: relevance ?? "MEDIUM",
          tags: tags ?? [],
          userId: user.id,
        },
        select: { id: true, title: true, type: true, relevance: true, url: true },
      });

      await logMcpActivity("added_research", "research", entry.id, entry.title, user);
      return ok(entry);
    }
  );

  server.registerTool(
    "list_decisions",
    {
      title: "Listar decisiones",
      description: "Lista el registro de decisiones del proyecto con contexto y rationale.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).optional().describe("Default 30"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ limit }) => {
      const decisions = await prisma.decision.findMany({
        orderBy: { createdAt: "desc" },
        take: limit ?? 30,
        select: {
          id: true,
          title: true,
          context: true,
          decision: true,
          rationale: true,
          alternatives: true,
          impact: true,
          status: true,
          madeBy: { select: userSelect },
          createdAt: true,
        },
      });
      return ok(decisions);
    }
  );

  server.registerTool(
    "list_experiments",
    {
      title: "Listar experimentos",
      description: "Lista experimentos con hipótesis, métricas y resultados.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).optional().describe("Default 30"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ limit }) => {
      const experiments = await prisma.experiment.findMany({
        orderBy: { createdAt: "desc" },
        take: limit ?? 30,
        select: {
          id: true,
          name: true,
          description: true,
          hypothesis: true,
          architecture: true,
          dataset: true,
          status: true,
          exhaustivity: true,
          precision: true,
          latency: true,
          cost: true,
          results: true,
          analysis: true,
          nextSteps: true,
          iteration: true,
          user: { select: userSelect },
          createdAt: true,
        },
      });
      return ok(experiments);
    }
  );
}
