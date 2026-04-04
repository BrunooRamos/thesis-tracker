import { prisma } from "@/lib/prisma";
import { PhaseProgress } from "@/components/dashboard/phase-progress";
import { NextMilestone } from "@/components/dashboard/next-milestone";
import { TeamCards } from "@/components/dashboard/team-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { Alerts } from "@/components/dashboard/alerts";

export default async function DashboardPage() {
  const [phases, milestones, users, tasks, activities, researchCount] =
    await Promise.all([
      prisma.phase.findMany({
        orderBy: { number: "asc" },
        include: { milestones: true },
      }),
      prisma.milestone.findMany({
        where: {
          status: { not: "COMPLETED" },
          dueDate: { gte: new Date() },
        },
        orderBy: { dueDate: "asc" },
        take: 1,
        include: { phase: true },
      }),
      prisma.user.findMany({
        include: {
          assignedTasks: {
            where: { status: { not: "DONE" } },
          },
          _count: {
            select: {
              assignedTasks: true,
              researchEntries: true,
            },
          },
        },
      }),
      prisma.task.findMany(),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.researchEntry.count(),
    ]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < new Date() && t.status !== "DONE"
  );
  const experimentsRun = 0; // v2

  const nextMilestone = milestones[0] || null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Phase Progress */}
      <PhaseProgress phases={phases} />

      {/* Row: Milestone + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NextMilestone milestone={nextMilestone} />
        </div>
        <QuickStats
          totalTasks={totalTasks}
          completedTasks={completedTasks}
          papersRead={researchCount}
          experimentsRun={experimentsRun}
        />
      </div>

      {/* Alerts */}
      {overdueTasks.length > 0 && <Alerts overdueTasks={overdueTasks} />}

      {/* Row: Team + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TeamCards users={users} />
        </div>
        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
}
