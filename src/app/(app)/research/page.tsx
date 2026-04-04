import { prisma } from "@/lib/prisma";
import { ResearchHub } from "@/components/research/research-hub";

export default async function ResearchPage() {
  const entries = await prisma.researchEntry.findMany({
    include: {
      user: true,
      resource: true,
      tasks: { include: { assignees: true } },
      decisions: { include: { madeBy: true } },
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const users = await prisma.user.findMany();

  // Collect all unique tags across entries
  const allTags = [...new Set(entries.flatMap((e) => e.tags))].sort();

  // Stats
  const stats = {
    total: entries.length,
    papers: entries.filter((e) => e.type === "PAPER").length,
    tools: entries.filter((e) => e.type === "TOOL").length,
    critical: entries.filter((e) => e.relevance === "CRITICAL").length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <ResearchHub
        initialEntries={JSON.parse(JSON.stringify(entries))}
        users={JSON.parse(JSON.stringify(users))}
        allTags={allTags}
        stats={stats}
      />
    </div>
  );
}
