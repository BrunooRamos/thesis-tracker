import { prisma } from "@/lib/prisma";
import { ResourcesPage } from "@/components/resources/resources-page";

export default async function ResourcesServerPage() {
  const [resources, users, phases, tags, researchEntries] = await Promise.all([
    prisma.resource.findMany({
      include: {
        addedBy: true,
        researchEntries: { include: { user: true } },
        tasks: { include: { assignee: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    }),
    prisma.user.findMany(),
    prisma.phase.findMany({ orderBy: { number: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.researchEntry.findMany({ select: { tags: true } }),
  ]);

  // Collect all unique research tags
  const allResearchTags = [
    ...new Set(researchEntries.flatMap((e) => e.tags)),
  ].sort();

  return (
    <div className="max-w-7xl mx-auto">
      <ResourcesPage
        resources={JSON.parse(JSON.stringify(resources))}
        users={JSON.parse(JSON.stringify(users))}
        phases={JSON.parse(JSON.stringify(phases))}
        tags={JSON.parse(JSON.stringify(tags))}
        allResearchTags={allResearchTags}
      />
    </div>
  );
}
