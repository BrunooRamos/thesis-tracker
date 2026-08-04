"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createMcpToken,
  renewMcpToken,
  revokeMcpToken,
} from "@/lib/mcp-tokens";
import { revalidatePath } from "next/cache";

// Token management is session-only: the MCP bearer token can never be used to
// mint, renew, or revoke tokens (no such tools are exposed on the endpoint).

export type McpTokenView = {
  id: string;
  name: string;
  tokenHint: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

function toView(t: {
  id: string;
  name: string;
  tokenHint: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}): McpTokenView {
  return {
    id: t.id,
    name: t.name,
    tokenHint: t.tokenHint,
    createdAt: t.createdAt.toISOString(),
    expiresAt: t.expiresAt.toISOString(),
    lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
    revokedAt: t.revokedAt?.toISOString() ?? null,
  };
}

async function requireSessionUser(): Promise<{ id: string; name: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return { id: session.user.id, name: session.user.name ?? "Unknown" };
}

export async function listMyMcpTokens(): Promise<McpTokenView[]> {
  const user = await requireSessionUser();
  const tokens = await prisma.mcpToken.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return tokens.map(toView);
}

export async function createMcpTokenAction(
  name?: string
): Promise<{ token: string; record: McpTokenView }> {
  const user = await requireSessionUser();
  const { plaintext, record } = await createMcpToken(user.id, name);

  await prisma.activityLog.create({
    data: {
      action: "created_mcp_token",
      entityType: "mcp_token",
      entityId: record.id,
      entityTitle: record.tokenHint,
      userId: user.id,
      userName: user.name,
    },
  });

  revalidatePath("/settings");
  // Only moment the plaintext leaves the server; it is never persisted.
  return { token: plaintext, record: toView(record) };
}

export async function renewMcpTokenAction(
  tokenId: string
): Promise<McpTokenView> {
  const user = await requireSessionUser();
  const record = await renewMcpToken(tokenId, user.id);

  await prisma.activityLog.create({
    data: {
      action: "renewed_mcp_token",
      entityType: "mcp_token",
      entityId: record.id,
      entityTitle: record.tokenHint,
      userId: user.id,
      userName: user.name,
    },
  });

  revalidatePath("/settings");
  return toView(record);
}

export async function revokeMcpTokenAction(
  tokenId: string
): Promise<McpTokenView> {
  const user = await requireSessionUser();
  const record = await revokeMcpToken(tokenId, user.id);

  await prisma.activityLog.create({
    data: {
      action: "revoked_mcp_token",
      entityType: "mcp_token",
      entityId: record.id,
      entityTitle: record.tokenHint,
      userId: user.id,
      userName: user.name,
    },
  });

  revalidatePath("/settings");
  return toView(record);
}
