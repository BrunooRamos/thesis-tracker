import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import type { Prisma } from "@/generated/prisma/client";
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
const MEETING_TYPE = ["HORIZON_CHECKIN", "TEAM_INTERNAL", "TUTOR_ACADEMIC", "OTHER"] as const;

// Same allowlist as /api/upload. Decoded cap is 3MB (below the app's 10MB):
// base64 inflates ~33% and serverless request bodies top out at 4.5MB.
const UPLOAD_MAX_BYTES = 3 * 1024 * 1024;
const UPLOAD_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  md: "text/markdown",
  markdown: "text/markdown",
  txt: "text/plain",
};

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
    "list_meetings",
    {
      title: "Listar minutas",
      description:
        "Lista minutas de reuniones con asistentes, resumen, action items y adjuntos.",
      inputSchema: z.object({
        type: z.enum(MEETING_TYPE).optional(),
        limit: z.number().int().min(1).max(100).optional().describe("Default 20"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ type, limit }) => {
      const meetings = await prisma.meetingNote.findMany({
        where: type ? { type } : undefined,
        orderBy: { date: "desc" },
        take: limit ?? 20,
        select: {
          id: true,
          title: true,
          date: true,
          type: true,
          attendees: true,
          summary: true,
          actionItems: true,
          keyDecisions: true,
          attachments: true,
          author: { select: userSelect },
          createdAt: true,
        },
      });
      return ok(meetings);
    }
  );

  server.registerTool(
    "create_meeting",
    {
      title: "Crear minuta",
      description:
        "Registra una minuta de reunión. Los adjuntos pueden ser links, o archivos subidos antes con upload_attachment (usando su url).",
      inputSchema: z.object({
        title: z.string().min(1),
        date: z.string().describe("Fecha de la reunión, ISO (YYYY-MM-DD)"),
        type: z.enum(MEETING_TYPE),
        summary: z.string().min(1),
        attendees: z.array(z.string()).optional().describe("Nombres de asistentes"),
        keyDecisions: z.string().optional(),
        actionItems: z
          .array(
            z.object({
              task: z.string(),
              assignee: z.string().optional().describe("Nombre del responsable"),
              dueDate: z.string().optional().describe("Fecha ISO"),
            })
          )
          .optional(),
        attachments: z
          .array(
            z.object({
              type: z.enum(["file", "link"]),
              name: z.string(),
              url: z.string(),
              fileType: z.string().optional(),
            })
          )
          .optional(),
      }),
    },
    async (
      { title, date, type, summary, attendees, keyDecisions, actionItems, attachments },
      ctx
    ) => {
      const user = requireUser(ctx as ToolContext);

      const meeting = await prisma.meetingNote.create({
        data: {
          title,
          date: parseDate(date, "date"),
          type,
          summary,
          attendees: attendees ?? [],
          keyDecisions,
          actionItems: (actionItems ?? []).map((ai) => ({
            task: ai.task,
            assignee: ai.assignee ?? "",
            dueDate: ai.dueDate ?? "",
          })) as Prisma.InputJsonValue[],
          attachments: (attachments ?? []) as unknown as Prisma.InputJsonValue[],
          authorId: user.id,
        },
        select: {
          id: true,
          title: true,
          date: true,
          type: true,
          attendees: true,
          attachments: true,
        },
      });

      await logMcpActivity("created_meeting", "meeting", meeting.id, meeting.title, user);
      return ok(meeting);
    }
  );

  server.registerTool(
    "upload_attachment",
    {
      title: "Subir adjunto",
      description:
        "Sube un archivo (base64) al storage y opcionalmente lo vincula a una minuta existente. Tipos: PDF, MD, TXT, PNG, JPG, GIF, WebP. Máximo 3MB; para archivos más grandes usar la web.",
      inputSchema: z.object({
        fileName: z.string().min(1).describe("Nombre con extensión, ej: minuta.pdf"),
        contentBase64: z.string().min(1).describe("Contenido del archivo en base64"),
        meetingId: z
          .string()
          .optional()
          .describe("Si se indica, el archivo se agrega a los adjuntos de esa minuta"),
      }),
    },
    async ({ fileName, contentBase64, meetingId }, ctx) => {
      const user = requireUser(ctx as ToolContext);

      const ext = fileName.toLowerCase().split(".").pop() ?? "";
      const fileType = UPLOAD_TYPES[ext];
      if (!fileType) {
        throw new Error(
          `Tipo de archivo no permitido: .${ext}. Permitidos: ${Object.keys(UPLOAD_TYPES).join(", ")}`
        );
      }

      const meeting = meetingId
        ? await prisma.meetingNote.findUnique({ where: { id: meetingId } })
        : null;
      if (meetingId && !meeting) throw new Error("Minuta no encontrada.");

      let buffer: Buffer;
      try {
        buffer = Buffer.from(contentBase64, "base64");
      } catch {
        throw new Error("contentBase64 no es base64 válido.");
      }
      if (buffer.length === 0) throw new Error("El archivo está vacío.");
      if (buffer.length > UPLOAD_MAX_BYTES) {
        throw new Error(
          `Archivo muy grande (${(buffer.length / 1024 / 1024).toFixed(1)}MB, máx. 3MB por MCP). Subilo desde la web.`
        );
      }

      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error("File storage no configurado (falta BLOB_READ_WRITE_TOKEN).");
      }

      const { put } = await import("@vercel/blob");
      const blob = await put(fileName, buffer, {
        access: "private",
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      const attachment = { type: "file", name: fileName, url: blob.url, fileType };

      if (meeting) {
        await prisma.meetingNote.update({
          where: { id: meeting.id },
          data: {
            attachments: { push: attachment as unknown as Prisma.InputJsonValue },
          },
        });
        await logMcpActivity(
          "updated_meeting",
          "meeting",
          meeting.id,
          meeting.title,
          user
        );
      }

      return ok({
        attachment,
        linkedToMeeting: meeting ? { id: meeting.id, title: meeting.title } : null,
      });
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
