import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean everything
  await prisma.comment.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.meetingNote.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.experiment.deleteMany();
  await prisma.researchEntry.deleteMany();
  await prisma.task.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.user.deleteMany();

  // --- USERS (first login will set their passwords) ---
  await prisma.user.create({
    data: {
      name: "Bruno",
      email: "bramos2@correo.um.edu.uy",
      password: "",
      needsSetup: true,
      role: "admin",
    },
  });

  await prisma.user.create({
    data: {
      name: "Rodrigo",
      email: "rsotelo1@correo.um.edu.uy",
      password: "",
      needsSetup: true,
      role: "member",
    },
  });

  await prisma.user.create({
    data: {
      name: "Martín",
      email: "msena1@correo.um.edu.uy",
      password: "",
      needsSetup: true,
      role: "member",
    },
  });

  // --- PHASES ---
  const phase1 = await prisma.phase.create({
    data: {
      number: 1,
      name: "Adquisición de Contexto",
      description:
        "Investigación inicial, entendimiento del dominio de Horizon, revisión de literatura y definición del alcance del proyecto.",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-05-15"),
      status: "IN_PROGRESS",
      progress: 0,
    },
  });

  const phase2 = await prisma.phase.create({
    data: {
      number: 2,
      name: "Diseño de Solución",
      description:
        "Diseño de la arquitectura del sistema, selección de tecnologías, definición de métricas y planificación de experimentos.",
      startDate: new Date("2026-05-16"),
      endDate: new Date("2026-07-31"),
      status: "NOT_STARTED",
      progress: 0,
    },
  });

  const phase3 = await prisma.phase.create({
    data: {
      number: 3,
      name: "Experimentación Iterativa",
      description:
        "Implementación de prototipos, ejecución de experimentos, evaluación de resultados y refinamiento iterativo.",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-10-31"),
      status: "NOT_STARTED",
      progress: 0,
    },
  });

  const phase4 = await prisma.phase.create({
    data: {
      number: 4,
      name: "Consolidación y Entrega",
      description:
        "Redacción del informe final, preparación de la defensa, documentación y entrega del proyecto.",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2026-12-15"),
      status: "NOT_STARTED",
      progress: 0,
    },
  });

  // --- MILESTONES ---
  const milestones = [
    { code: "H1", name: "Kick-off con Horizon", dueDate: new Date("2026-03-10"), isFaculty: false, phaseId: phase1.id },
    { code: "H2", name: "Revisión de literatura completa", dueDate: new Date("2026-04-15"), isFaculty: false, phaseId: phase1.id },
    { code: "H3", name: "Entrega Plan de Proyecto (Facultad)", dueDate: new Date("2026-04-30"), isFaculty: true, phaseId: phase1.id },
    { code: "H4", name: "Revisión 30% (Facultad)", dueDate: new Date("2026-05-20"), isFaculty: true, phaseId: phase1.id },
    { code: "H5", name: "Arquitectura definida", dueDate: new Date("2026-06-15"), isFaculty: false, phaseId: phase2.id },
    { code: "H6", name: "Benchmark y métricas definidos", dueDate: new Date("2026-07-01"), isFaculty: false, phaseId: phase2.id },
    { code: "H7", name: "Revisión 50% (Facultad)", dueDate: new Date("2026-07-20"), isFaculty: true, phaseId: phase2.id },
    { code: "H8", name: "Primer ciclo de experimentos completo", dueDate: new Date("2026-08-31"), isFaculty: false, phaseId: phase3.id },
    { code: "H9", name: "Revisión 80% (Facultad)", dueDate: new Date("2026-10-01"), isFaculty: true, phaseId: phase3.id },
    { code: "H10", name: "Experimentos finales completos", dueDate: new Date("2026-10-31"), isFaculty: false, phaseId: phase3.id },
    { code: "H11", name: "Borrador informe final", dueDate: new Date("2026-11-30"), isFaculty: false, phaseId: phase4.id },
    { code: "H12", name: "Defensa de Tesis (Facultad)", dueDate: new Date("2026-12-15"), isFaculty: true, phaseId: phase4.id },
  ];

  for (const m of milestones) {
    await prisma.milestone.create({ data: m });
  }

  // --- TAGS ---
  const tagData = [
    { name: "RLM", color: "#ff7c11" },
    { name: "Deep Agent", color: "#9a4a00" },
    { name: "ReAct", color: "#10B981" },
    { name: "CoT", color: "#F59E0B" },
    { name: "RAG", color: "#EF4444" },
    { name: "Benchmark", color: "#EC4899" },
    { name: "Exhaustividad", color: "#14B8A6" },
    { name: "Horizon", color: "#ff9a3e" },
    { name: "Latencia", color: "#F97316" },
    { name: "Costo", color: "#84CC16" },
    { name: "Paper", color: "#06B6D4" },
    { name: "Herramienta", color: "#A855F7" },
  ];

  for (const t of tagData) {
    await prisma.tag.create({ data: t });
  }

  console.log("Seed completed!");
  console.log("Created 3 users (need first-login password setup)");
  console.log("Created 4 phases with 12 milestones");
  console.log("Created 12 tags");
  console.log("No fake tasks/research/activity — start fresh!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
