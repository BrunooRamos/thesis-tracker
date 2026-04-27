import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ActivitiesPage } from "@/components/activities/activities-page";

export const dynamic = "force-dynamic";

export default async function HitosPage() {
  const session = await auth();

  const [activities, users, phases] = await Promise.all([
    prisma.activity.findMany({
      include: {
        phase: true,
        owners: true,
        tasks: { include: { assignees: true } },
        deliverables: { orderBy: { order: "asc" } },
        acceptanceCriteria: { orderBy: { order: "asc" } },
      },
      orderBy: { wbsCode: "asc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.phase.findMany({ orderBy: { number: "asc" } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ActivitiesPage
        initialActivities={JSON.parse(JSON.stringify(activities))}
        users={JSON.parse(JSON.stringify(users))}
        phases={JSON.parse(JSON.stringify(phases))}
        currentUserId={session?.user?.id ?? ""}
      />
    </div>
  );
}
