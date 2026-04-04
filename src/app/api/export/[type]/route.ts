import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await params;

  switch (type) {
    case "research":
      return exportResearch();
    case "experiments":
      return exportExperiments();
    case "decisions":
      return exportDecisions();
    case "meetings":
      return exportMeetings();
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
}

function escapeCSV(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(fields: (string | null | undefined)[]): string {
  return fields.map(escapeCSV).join(",");
}

function csvResponse(content: string, type: string): NextResponse {
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

function mdResponse(content: string, type: string): NextResponse {
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-export-${new Date().toISOString().split("T")[0]}.md"`,
    },
  });
}

async function exportResearch() {
  const entries = await prisma.researchEntry.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const header = csvRow([
    "Título",
    "Tipo",
    "Autores",
    "URL",
    "Resumen",
    "Hallazgos Clave",
    "Relevancia",
    "Tags",
    "Agregado por",
    "Fecha",
  ]);

  const rows = entries.map((e) =>
    csvRow([
      e.title,
      e.type,
      e.authors,
      e.url,
      e.summary,
      e.keyFindings,
      e.relevance,
      e.tags.join(", "),
      e.user.name,
      e.createdAt.toISOString().split("T")[0],
    ])
  );

  return csvResponse([header, ...rows].join("\n"), "research");
}

async function exportExperiments() {
  const experiments = await prisma.experiment.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const header = csvRow([
    "Nombre",
    "Arquitectura",
    "Hipótesis",
    "Dataset",
    "Estado",
    "Exhaustividad",
    "Precisión",
    "Latencia(s)",
    "Costo(USD)",
    "Tokens",
    "Iteración",
    "Resultados",
    "Análisis",
    "Próximos pasos",
    "Corrido por",
    "Fecha",
  ]);

  const rows = experiments.map((e) =>
    csvRow([
      e.name,
      e.architecture,
      e.hypothesis,
      e.dataset,
      e.status,
      e.exhaustivity != null ? String(e.exhaustivity) : null,
      e.precision != null ? String(e.precision) : null,
      e.latency != null ? String(e.latency) : null,
      e.cost != null ? String(e.cost) : null,
      e.tokenCount != null ? String(e.tokenCount) : null,
      String(e.iteration),
      e.results,
      e.analysis,
      e.nextSteps,
      e.user.name,
      e.createdAt.toISOString().split("T")[0],
    ])
  );

  return csvResponse([header, ...rows].join("\n"), "experiments");
}

async function exportDecisions() {
  const decisions = await prisma.decision.findMany({
    include: { madeBy: true },
    orderBy: { createdAt: "desc" },
  });

  const exportDate = new Date().toISOString().split("T")[0];
  let md = `# Decision Log — Horizon Thesis Tracker\nExportado: ${exportDate}\n`;

  decisions.forEach((d, i) => {
    md += `\n---\n\n`;
    md += `## ${i + 1}. ${d.title}\n`;
    md += `**Estado:** ${d.status} | **Decidido por:** ${d.madeBy.name} | **Fecha:** ${d.createdAt.toISOString().split("T")[0]}\n\n`;
    md += `### Contexto\n${d.context}\n\n`;
    md += `### Decisión\n${d.decision}\n\n`;
    md += `### Justificación\n${d.rationale}\n\n`;
    if (d.alternatives) {
      md += `### Alternativas consideradas\n${d.alternatives}\n\n`;
    }
    if (d.impact) {
      md += `### Impacto esperado\n${d.impact}\n\n`;
    }
  });

  return mdResponse(md, "decisions");
}

async function exportMeetings() {
  const meetings = await prisma.meetingNote.findMany({
    include: { author: true },
    orderBy: { date: "desc" },
  });

  const exportDate = new Date().toISOString().split("T")[0];
  let md = `# Meeting Notes — Horizon Thesis Tracker\nExportado: ${exportDate}\n`;

  meetings.forEach((m) => {
    md += `\n---\n\n`;
    md += `## ${m.title}\n`;
    md += `**Tipo:** ${m.type} | **Fecha:** ${m.date.toISOString().split("T")[0]} | **Autor:** ${m.author.name}\n`;
    md += `**Asistentes:** ${m.attendees.join(", ")}\n\n`;
    md += `### Resumen\n${m.summary}\n\n`;

    if (m.keyDecisions) {
      md += `### Decisiones Clave\n${m.keyDecisions}\n\n`;
    }

    const actionItems = (m.actionItems ?? []) as Record<string, unknown>[];
    if (actionItems.length > 0) {
      md += `### Acciones\n`;
      actionItems.forEach((item) => {
        const task = (item.task as string) || (item.title as string) || "";
        const assignee = (item.assignee as string) || "";
        const dueDate = (item.dueDate as string) || "";
        if (assignee || dueDate) {
          md += `- ${task} → ${assignee}${dueDate ? ` (${dueDate})` : ""}\n`;
        } else {
          md += `- ${task}\n`;
        }
      });
      md += `\n`;
    }
  });

  return mdResponse(md, "meetings");
}
