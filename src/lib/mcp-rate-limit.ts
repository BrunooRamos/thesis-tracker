// In-memory limiter for failed MCP auth attempts, to slow token brute-forcing.
// Per-instance state (resets on redeploy / doesn't sync across serverless
// instances), which is enough of a speed bump for this app's exposure.

const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 10;

const failures = new Map<string, number[]>();

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export function isRateLimited(ip: string): boolean {
  const cutoff = Date.now() - WINDOW_MS;
  const recent = (failures.get(ip) ?? []).filter((t) => t > cutoff);
  failures.set(ip, recent);
  return recent.length >= MAX_FAILURES;
}

export function recordAuthFailure(ip: string): void {
  const cutoff = Date.now() - WINDOW_MS;
  const recent = (failures.get(ip) ?? []).filter((t) => t > cutoff);
  recent.push(Date.now());
  failures.set(ip, recent);

  // Bound memory: drop the oldest bucket if the map grows unreasonably.
  if (failures.size > 10_000) {
    const oldest = failures.keys().next().value;
    if (oldest) failures.delete(oldest);
  }
}
