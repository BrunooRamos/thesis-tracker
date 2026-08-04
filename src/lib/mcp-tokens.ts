import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";
import type { McpToken, User } from "@/generated/prisma/client";

// Token lifecycle: created from an authenticated session, valid for 30 days,
// manually renewable for another 30 days without rotating the token value.
export const MCP_TOKEN_TTL_DAYS = 30;
// Cap on non-revoked tokens per user to keep credential sprawl bounded.
export const MAX_ACTIVE_TOKENS_PER_USER = 5;

const TOKEN_PREFIX = "mcp_";
// Avoid a DB write per MCP request: lastUsedAt is refreshed at most every 5 min.
const LAST_USED_THROTTLE_MS = 5 * 60 * 1000;

function ttlFromNow(): Date {
  return new Date(Date.now() + MCP_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

// SHA-256 of the plaintext. Only the hash is persisted, so a DB leak does not
// expose usable credentials. Lookup by unique hash also makes verification
// timing-safe in practice: the attacker would need a preimage to influence it.
export function hashMcpToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isMcpTokenFormat(token: string): boolean {
  return /^mcp_[A-Za-z0-9_-]{43}$/.test(token);
}

export async function createMcpToken(
  userId: string,
  name?: string
): Promise<{ plaintext: string; record: McpToken }> {
  const activeCount = await prisma.mcpToken.count({
    where: { userId, revokedAt: null },
  });
  if (activeCount >= MAX_ACTIVE_TOKENS_PER_USER) {
    throw new Error(
      `Límite de ${MAX_ACTIVE_TOKENS_PER_USER} tokens activos alcanzado. Revocá alguno antes de crear otro.`
    );
  }

  // 32 random bytes -> 43 chars base64url. The mcp_ prefix makes leaked
  // tokens easy to catch with secret scanners.
  const plaintext = TOKEN_PREFIX + randomBytes(32).toString("base64url");

  const record = await prisma.mcpToken.create({
    data: {
      name: name?.trim() || "MCP",
      tokenHash: hashMcpToken(plaintext),
      tokenHint: `${TOKEN_PREFIX}…${plaintext.slice(-4)}`,
      userId,
      expiresAt: ttlFromNow(),
    },
  });

  return { plaintext, record };
}

export type VerifiedMcpToken = {
  token: McpToken;
  user: Pick<User, "id" | "name" | "email" | "role">;
};

// Validates a bearer token for the MCP endpoint. Returns null for anything
// invalid: bad format, unknown, revoked, or expired.
export async function verifyMcpToken(
  bearer: string
): Promise<VerifiedMcpToken | null> {
  if (!isMcpTokenFormat(bearer)) return null;

  const record = await prisma.mcpToken.findUnique({
    where: { tokenHash: hashMcpToken(bearer) },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!record) return null;
  if (record.revokedAt) return null;
  if (record.expiresAt.getTime() <= Date.now()) return null;

  const lastUsed = record.lastUsedAt?.getTime() ?? 0;
  if (Date.now() - lastUsed > LAST_USED_THROTTLE_MS) {
    // Fire-and-forget: audit freshness must not add latency or break requests.
    prisma.mcpToken
      .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});
  }

  const { user, ...token } = record;
  return { token, user };
}

// Extends expiry to now + 30 days keeping the same token value. Owner-only;
// revoked tokens stay dead — renewal must not resurrect them.
export async function renewMcpToken(
  tokenId: string,
  userId: string
): Promise<McpToken> {
  const record = await prisma.mcpToken.findUnique({ where: { id: tokenId } });
  if (!record || record.userId !== userId) {
    throw new Error("Token no encontrado.");
  }
  if (record.revokedAt) {
    throw new Error("El token fue revocado y no puede renovarse.");
  }

  return prisma.mcpToken.update({
    where: { id: tokenId },
    data: { expiresAt: ttlFromNow() },
  });
}

export async function revokeMcpToken(
  tokenId: string,
  userId: string
): Promise<McpToken> {
  const record = await prisma.mcpToken.findUnique({ where: { id: tokenId } });
  if (!record || record.userId !== userId) {
    throw new Error("Token no encontrado.");
  }
  if (record.revokedAt) return record;

  return prisma.mcpToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });
}
