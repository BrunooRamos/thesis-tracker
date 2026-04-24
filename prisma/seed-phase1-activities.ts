/**
 * Pre-load Phase 1 activities from the official project plan
 * (plan_proyecto_tesis_v2_1.md).
 *
 * Creates one Deliverable per activity as described in the plan. No owners
 * assigned — the team will distribute them in the UI. Idempotent: uses
 * wbsCode as unique key, so re-running is safe.
 *
 *   npx tsx prisma/seed-phase1-activities.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

type SeedActivity = {
  wbsCode: string;
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  deliverable: { title: string; description?: string };
};

// Fase 1: Caracterización del Problema y Estado del Arte
// Dates are approximate, mapped to the Gantt in the plan (Apr – mid-Jun 2026)
const phase1Activities: SeedActivity[] = [
  {
    wbsCode: "1.1.1",
    name: "Caracterización inicial del problema de data exhaustiva",
    description:
      "Definir formalmente el problema de data exhaustiva, identificar casos de uso concretos en Horizon y diferenciarlo de problemas relacionados (retrieval, RAG, etc.).",
    startDate: new Date("2026-04-01"),
    endDate: new Date("2026-04-30"),
    deliverable: {
      title: "Documento de caracterización del problema",
      description:
        "Definición formal, casos de uso en Horizon, y diferenciación con problemas relacionados.",
    },
  },
  {
    wbsCode: "1.1.2",
    name: "Relevamiento de arquitecturas candidatas",
    description:
      "Investigar arquitecturas candidatas: tradicionales (ReAct, CoT, RAG, multi-agent), recursivas (RLMs, Deep Agents recursivos), reflection-based y otras emergentes relevantes.",
    startDate: new Date("2026-04-15"),
    endDate: new Date("2026-05-20"),
    deliverable: {
      title: "Relevamiento de arquitecturas",
      description:
        "Documento consolidando arquitecturas tradicionales, recursivas, reflection-based y emergentes.",
    },
  },
  {
    wbsCode: "1.1.3",
    name: "Revisión de benchmarks existentes",
    description:
      "Revisar benchmarks existentes (SWE-bench, WebArena, GAIA) e identificar gaps para contextos enterprise.",
    startDate: new Date("2026-05-05"),
    endDate: new Date("2026-05-25"),
    deliverable: {
      title: "Análisis de benchmarks",
      description:
        "Análisis de benchmarks existentes con identificación de gaps para contextos enterprise.",
    },
  },
  {
    wbsCode: "1.1.4",
    name: "Selección de arquitecturas candidatas",
    description:
      "Seleccionar arquitecturas candidatas a evaluar con justificación clara. El número final dependerá del relevamiento y se fijará al cierre de la Fase 1.",
    startDate: new Date("2026-05-20"),
    endDate: new Date("2026-06-05"),
    deliverable: {
      title: "Documento de selección con criterios",
      description:
        "Lista final de arquitecturas candidatas a evaluar, con criterios de selección justificados.",
    },
  },
  {
    wbsCode: "1.1.5",
    name: "Redacción del documento de estado del arte",
    description:
      "Consolidar todo el trabajo de la fase en un documento de estado del arte: problema, relevamiento, benchmarks y arquitecturas seleccionadas.",
    startDate: new Date("2026-05-25"),
    endDate: new Date("2026-06-15"),
    deliverable: {
      title: "Documento de estado del arte",
      description:
        "Documento consolidado de Fase 1, listo para Revisión 30% de facultad.",
    },
  },
];

async function main() {
  console.log("🌱 Seeding Phase 1 activities...\n");

  const phase1 = await prisma.phase.findFirst({ where: { number: 1 } });
  if (!phase1) throw new Error("Phase 1 not found in DB. Did you seed phases first?");

  console.log(`  Phase 1 found: ${phase1.name} (id=${phase1.id})\n`);

  for (const a of phase1Activities) {
    const existing = await prisma.activity.findUnique({
      where: { wbsCode: a.wbsCode },
    });

    if (existing) {
      console.log(`  = ${a.wbsCode}: ${a.name} (already exists, skipping)`);
      continue;
    }

    const activity = await prisma.activity.create({
      data: {
        wbsCode: a.wbsCode,
        name: a.name,
        description: a.description,
        phaseId: phase1.id,
        startDate: a.startDate,
        endDate: a.endDate,
        deliverables: {
          create: [
            {
              title: a.deliverable.title,
              description: a.deliverable.description,
              order: 0,
            },
          ],
        },
      },
    });

    console.log(`  ✔ ${activity.wbsCode}: ${activity.name}`);
  }

  console.log(`\n✅ Done. ${phase1Activities.length} Phase 1 activities seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
