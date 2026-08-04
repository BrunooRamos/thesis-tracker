import { createMcpHandler, withMcpAuth } from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { registerTools } from "@/lib/mcp-server";
import { verifyMcpToken } from "@/lib/mcp-tokens";
import {
  clientIp,
  isRateLimited,
  recordAuthFailure,
} from "@/lib/mcp-rate-limit";

// MCP endpoint (Streamable HTTP, stateless). Auth: Bearer token generado en
// Configuración → MCP. withMcpAuth responde 401 con WWW-Authenticate si falta
// o no valida, y re-chequea expiresAt en cada request.

const mcpHandler = createMcpHandler(registerTools, {
  serverInfo: { name: "thesis-tracker", version: "1.0.0" },
});

async function verifyToken(
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;

  const verified = await verifyMcpToken(bearerToken);
  if (!verified) return undefined;

  return {
    token: bearerToken,
    clientId: verified.user.id,
    scopes: ["thesis:read", "thesis:write"],
    expiresAt: Math.floor(verified.token.expiresAt.getTime() / 1000),
    extra: {
      userId: verified.user.id,
      userName: verified.user.name,
      userEmail: verified.user.email,
    },
  };
}

const authedHandler = withMcpAuth(mcpHandler, verifyToken, { required: true });

async function handler(req: Request): Promise<Response> {
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return Response.json(
      { error: "too_many_requests" },
      { status: 429, headers: { "Retry-After": "600" } }
    );
  }

  const res = await authedHandler(req);
  if (res.status === 401) recordAuthFailure(ip);
  return res;
}

export { handler as GET, handler as POST, handler as DELETE };
