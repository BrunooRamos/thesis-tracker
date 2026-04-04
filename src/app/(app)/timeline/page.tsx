import { prisma } from "@/lib/prisma";
import { TimelineView } from "@/components/timeline/timeline-view";

export default async function TimelinePage() {
  const [phases, tasks, research, experiments, meetings, decisions] =
    await Promise.all([
      prisma.phase.findMany({
        include: { milestones: true },
        orderBy: { number: "asc" },
      }),
      prisma.task.findMany({
        include: { assignees: true, phase: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.researchEntry.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.experiment.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.meetingNote.findMany({
        include: { author: true },
        orderBy: { date: "desc" },
      }),
      prisma.decision.findMany({
        include: { madeBy: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return (
    <div className="max-w-7xl mx-auto">
      <TimelineView
        phases={JSON.parse(JSON.stringify(phases))}
        tasks={JSON.parse(JSON.stringify(tasks))}
        research={JSON.parse(JSON.stringify(research))}
        experiments={JSON.parse(JSON.stringify(experiments))}
        meetings={JSON.parse(JSON.stringify(meetings))}
        decisions={JSON.parse(JSON.stringify(decisions))}
      />
    </div>
  );
}
