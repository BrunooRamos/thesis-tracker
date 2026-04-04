import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const [tasks, research, experiments, decisions, meetings, resources] =
    await Promise.all([
      prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { assignees: true, phase: true },
        take: 5,
      }),
      prisma.researchEntry.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { summary: { contains: q, mode: "insensitive" } },
            { keyFindings: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { user: true },
        take: 5,
      }),
      prisma.experiment.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { hypothesis: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { user: true },
        take: 5,
      }),
      prisma.decision.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { decision: { contains: q, mode: "insensitive" } },
            { rationale: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { madeBy: true },
        take: 5,
      }),
      prisma.meetingNote.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { summary: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { author: true },
        take: 5,
      }),
      prisma.resource.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),
    ]);

  return NextResponse.json({
    results: { tasks, research, experiments, decisions, meetings, resources },
  });
}
