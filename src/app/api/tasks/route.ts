import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET /api/tasks?unlinked=1 returns tasks without an activity link.
// Default returns all tasks (lightweight, with assignees).
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const unlinked = url.searchParams.get("unlinked");

  const tasks = await prisma.task.findMany({
    where: unlinked ? { activityId: null } : undefined,
    include: { assignees: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}
