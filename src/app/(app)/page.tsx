import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const now = new Date();

  const [
    phases,
    nextMilestones,
    allMilestones,
    users,
    tasks,
    activities,
    researchCount,
    experimentCount,
    decisionCount,
    meetingCount,
    recentResearch,
    recentDecisions,
  ] = await Promise.all([
    prisma.phase.findMany({
      orderBy: { number: "asc" },
      include: { milestones: { orderBy: { dueDate: "asc" } } },
    }),
    prisma.milestone.findMany({
      where: { status: { not: "COMPLETED" }, dueDate: { gte: now } },
      orderBy: { dueDate: "asc" },
      take: 3,
      include: { phase: true },
    }),
    prisma.milestone.findMany({
      orderBy: { dueDate: "asc" },
      include: { phase: true },
    }),
    prisma.user.findMany({
      include: {
        assignedTasks: true,
        _count: {
          select: {
            assignedTasks: true,
            researchEntries: true,
            experiments: true,
          },
        },
      },
    }),
    prisma.task.findMany({
      include: { assignee: true, phase: true, tags: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.researchEntry.count(),
    prisma.experiment.count(),
    prisma.decision.count(),
    prisma.meetingNote.count(),
    prisma.researchEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { user: true },
    }),
    prisma.decision.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { madeBy: true },
    }),
  ]);

  // Compute stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < now && t.status !== "DONE"
  );
  const unassignedTasks = tasks.filter((t) => !t.assigneeId && t.status !== "DONE");

  // Project overall progress
  const totalPhaseProgress = phases.reduce((acc, p) => acc + p.progress, 0);
  const overallProgress = phases.length > 0 ? Math.round(totalPhaseProgress / phases.length) : 0;

  // Days info
  const projectStart = new Date("2026-03-01");
  const projectEnd = new Date("2026-12-15");
  const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(0, Math.ceil((now.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)));
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const timeProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  // Per-user task distribution
  const tasksByStatus = {
    TODO: tasks.filter((t) => t.status === "TODO").length,
    IN_PROGRESS: inProgressTasks,
    IN_REVIEW: tasks.filter((t) => t.status === "IN_REVIEW").length,
    DONE: completedTasks,
  };

  const data = {
    phases,
    nextMilestones,
    allMilestones,
    users,
    tasks,
    activities,
    stats: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      researchCount,
      experimentCount,
      decisionCount,
      meetingCount,
      overallProgress,
      timeProgress,
      elapsedDays,
      remainingDays,
      totalDays,
      tasksByStatus,
    },
    overdueTasks,
    unassignedTasks,
    recentResearch,
    recentDecisions,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <DashboardClient data={JSON.parse(JSON.stringify(data))} />
    </div>
  );
}
