import { prisma } from "@/lib/prisma";
import { DecisionLog } from "@/components/decisions/decision-log";

export default async function DecisionsPage() {
  const [decisions, users, meetings, researchEntries, experiments, phases, tags] =
    await Promise.all([
      prisma.decision.findMany({
        include: {
          madeBy: true,
          meetingNote: true,
          researchEntry: { include: { user: true } },
          experiment: true,
          tasks: { include: { assignees: true } },
          comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany(),
      prisma.meetingNote.findMany({ orderBy: { date: "desc" } }),
      prisma.researchEntry.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.experiment.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.phase.findMany({ orderBy: { number: "asc" } }),
      prisma.tag.findMany({ orderBy: { name: "asc" } }),
    ]);

  return (
    <div className="max-w-5xl mx-auto">
      <DecisionLog
        initialDecisions={JSON.parse(JSON.stringify(decisions))}
        users={JSON.parse(JSON.stringify(users))}
        meetings={JSON.parse(JSON.stringify(meetings))}
        researchEntries={JSON.parse(JSON.stringify(researchEntries))}
        experiments={JSON.parse(JSON.stringify(experiments))}
        phases={JSON.parse(JSON.stringify(phases))}
        tags={JSON.parse(JSON.stringify(tags))}
      />
    </div>
  );
}
