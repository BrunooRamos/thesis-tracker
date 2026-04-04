import { prisma } from "@/lib/prisma";
import { SettingsPanel } from "@/components/settings/settings-panel";

export default async function SettingsPage() {
  const [phases, users, tags] = await Promise.all([
    prisma.phase.findMany({
      orderBy: { number: "asc" },
      include: { milestones: { orderBy: { dueDate: "asc" } } },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <SettingsPanel
        phases={JSON.parse(JSON.stringify(phases))}
        users={JSON.parse(JSON.stringify(users))}
        tags={JSON.parse(JSON.stringify(tags))}
      />
    </div>
  );
}
