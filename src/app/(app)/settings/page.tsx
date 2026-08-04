import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { listMyMcpTokens } from "./mcp-actions";
import type { McpTokenView } from "./mcp-actions";

export const dynamic = "force-dynamic";


export default async function SettingsPage() {
  const session = await auth();
  const [phases, users, tags, mcpTokens] = await Promise.all([
    prisma.phase.findMany({
      orderBy: { number: "asc" },
      include: { milestones: { orderBy: { dueDate: "asc" } } },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    session?.user?.id ? listMyMcpTokens() : ([] as McpTokenView[]),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <SettingsPanel
        phases={JSON.parse(JSON.stringify(phases))}
        users={JSON.parse(JSON.stringify(users))}
        tags={JSON.parse(JSON.stringify(tags))}
        mcpTokens={mcpTokens}
      />
    </div>
  );
}
