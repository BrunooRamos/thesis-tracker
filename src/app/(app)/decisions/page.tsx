import { prisma } from "@/lib/prisma";
import { DecisionLog } from "@/components/decisions/decision-log";

export default async function DecisionsPage() {
  const [decisions, users] = await Promise.all([
    prisma.decision.findMany({
      include: {
        madeBy: true,
        comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany(),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <DecisionLog
        initialDecisions={JSON.parse(JSON.stringify(decisions))}
        users={JSON.parse(JSON.stringify(users))}
      />
    </div>
  );
}
