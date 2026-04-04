import { prisma } from "@/lib/prisma";
import { TimelineView } from "@/components/timeline/timeline-view";

export default async function TimelinePage() {
  const [phases, tasks] = await Promise.all([
    prisma.phase.findMany({
      include: { milestones: true },
      orderBy: { number: "asc" },
    }),
    prisma.task.findMany({
      include: { phase: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <TimelineView
        phases={JSON.parse(JSON.stringify(phases))}
        tasks={JSON.parse(JSON.stringify(tasks))}
      />
    </div>
  );
}
