/**
 * One-off migration script to update phase and milestone dates
 * per the updated project plan (plan_proyecto_tesis_v2_1.md).
 *
 * This script ONLY updates:
 *   - Phase start/end dates
 *   - Milestone dueDate + isFaculty
 *   - Creates H13 if it doesn't exist
 *
 * Does NOT touch: tasks, research, experiments, decisions, meetings,
 * resources, users, tags, comments, activity logs.
 *
 * Run with: npx tsx prisma/update-timeline.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// New phase boundaries per the updated plan
const phaseUpdates = [
  { number: 1, startDate: new Date("2026-04-01"), endDate: new Date("2026-06-15") },
  { number: 2, startDate: new Date("2026-06-16"), endDate: new Date("2026-07-31") },
  { number: 3, startDate: new Date("2026-08-01"), endDate: new Date("2026-10-31") },
  { number: 4, startDate: new Date("2026-11-01"), endDate: new Date("2026-12-19") },
];

// New milestone dates & faculty flags per the updated plan
const milestoneUpdates = [
  { code: "H1",  dueDate: new Date("2026-04-15"), isFaculty: false, phaseNumber: 1,
    name: "Plan de proyecto entregado" },
  { code: "H2",  dueDate: new Date("2026-04-30"), isFaculty: false, phaseNumber: 1,
    name: "Problema de data exhaustiva caracterizado formalmente" },
  { code: "H3",  dueDate: new Date("2026-05-15"), isFaculty: false, phaseNumber: 1,
    name: "Relevamiento de arquitecturas y benchmarks completado" },
  { code: "H4",  dueDate: new Date("2026-05-30"), isFaculty: false, phaseNumber: 1,
    name: "Arquitecturas candidatas seleccionadas" },
  { code: "H5",  dueDate: new Date("2026-06-15"), isFaculty: true,  phaseNumber: 1,
    name: "Revisión 30% — Fase 1 completa (Facultad)" },
  { code: "H6",  dueDate: new Date("2026-07-15"), isFaculty: false, phaseNumber: 2,
    name: "Arquitectura de Horizon comprendida y dataset construido" },
  { code: "H7",  dueDate: new Date("2026-07-31"), isFaculty: false, phaseNumber: 2,
    name: "Framework de evaluación y métricas definidas" },
  { code: "H8",  dueDate: new Date("2026-08-31"), isFaculty: false, phaseNumber: 3,
    name: "Primer ciclo de experimentación completado" },
  { code: "H9",  dueDate: new Date("2026-09-20"), isFaculty: true,  phaseNumber: 3,
    name: "Revisión 70% — Resultados experimentales sólidos (Facultad)" },
  { code: "H10", dueDate: new Date("2026-10-31"), isFaculty: false, phaseNumber: 3,
    name: "Ciclos iterativos avanzados, análisis comparativo" },
  { code: "H11", dueDate: new Date("2026-11-20"), isFaculty: true,  phaseNumber: 4,
    name: "Primer borrador completo del informe (Facultad)" },
  { code: "H12", dueDate: new Date("2026-12-05"), isFaculty: true,  phaseNumber: 4,
    name: "Documentos finales entregados (Facultad)" },
  { code: "H13", dueDate: new Date("2026-12-18"), isFaculty: true,  phaseNumber: 4,
    name: "Defensa oral (Facultad)" },
];

async function main() {
  console.log("🚀 Updating phases and milestones...\n");

  // ── PHASES ──────────────────────────────────────────────
  console.log("📅 Updating phase dates:");
  for (const p of phaseUpdates) {
    const result = await prisma.phase.updateMany({
      where: { number: p.number },
      data: { startDate: p.startDate, endDate: p.endDate },
    });
    console.log(
      `  Phase ${p.number}: ${p.startDate.toISOString().split("T")[0]} → ${p.endDate.toISOString().split("T")[0]}  (updated ${result.count})`
    );
  }

  // ── MILESTONES ──────────────────────────────────────────
  console.log("\n🎯 Updating milestones:");
  const phases = await prisma.phase.findMany();
  const phaseByNumber = new Map(phases.map((p) => [p.number, p.id]));

  for (const m of milestoneUpdates) {
    const phaseId = phaseByNumber.get(m.phaseNumber);
    if (!phaseId) {
      console.log(`  ⚠️  Phase ${m.phaseNumber} not found, skipping ${m.code}`);
      continue;
    }

    const existing = await prisma.milestone.findFirst({ where: { code: m.code } });

    if (existing) {
      await prisma.milestone.update({
        where: { id: existing.id },
        data: {
          dueDate: m.dueDate,
          isFaculty: m.isFaculty,
          phaseId,
          name: m.name,
        },
      });
      console.log(
        `  ${m.code}: ${m.dueDate.toISOString().split("T")[0]}${m.isFaculty ? " [Facultad]" : ""}  (updated)`
      );
    } else {
      await prisma.milestone.create({
        data: {
          code: m.code,
          name: m.name,
          dueDate: m.dueDate,
          isFaculty: m.isFaculty,
          phaseId,
          status: "PENDING",
        },
      });
      console.log(
        `  ${m.code}: ${m.dueDate.toISOString().split("T")[0]}${m.isFaculty ? " [Facultad]" : ""}  (created)`
      );
    }
  }

  console.log("\n✅ Timeline updated!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
