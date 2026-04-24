import { prisma } from "@/lib/prisma";
import { TeamView } from "@/components/team/team-view";

export const dynamic = "force-dynamic";


export default async function TeamPage() {
  const users = await prisma.user.findMany({
    include: {
      assignedTasks: { include: { phase: true, tags: true } },
      researchEntries: true,
      experiments: true,
      _count: {
        select: {
          assignedTasks: true,
          researchEntries: true,
          experiments: true,
          comments: true,
        },
      },
    },
  });

  const activities = await prisma.activityLog.findMany({
    where: {
      userId: { in: users.map((u) => u.id) },
    },
    orderBy: { createdAt: "desc" },
    take: 20 * users.length,
  });

  // Group activities by user, max 20 each
  const activitiesByUser: Record<string, typeof activities> = {};
  for (const activity of activities) {
    if (!activitiesByUser[activity.userId]) {
      activitiesByUser[activity.userId] = [];
    }
    if (activitiesByUser[activity.userId].length < 20) {
      activitiesByUser[activity.userId].push(activity);
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <TeamView
        users={JSON.parse(JSON.stringify(users))}
        activitiesByUser={JSON.parse(JSON.stringify(activitiesByUser))}
      />
    </div>
  );
}
