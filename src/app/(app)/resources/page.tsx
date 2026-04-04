import { prisma } from "@/lib/prisma";
import { ResourcesPage } from "@/components/resources/resources-page";

export default async function ResourcesServerPage() {
  const resources = await prisma.resource.findMany({
    include: { addedBy: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-7xl mx-auto">
      <ResourcesPage resources={JSON.parse(JSON.stringify(resources))} />
    </div>
  );
}
