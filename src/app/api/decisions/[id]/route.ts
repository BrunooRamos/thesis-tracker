import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const decision = await prisma.decision.findUnique({
    where: { id },
    include: {
      madeBy: true,
      meetingNote: true,
      researchEntry: { include: { user: true } },
      experiment: true,
      tasks: { include: { assignees: true } },
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!decision) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(decision);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  const allowedFields = [
    "title",
    "context",
    "decision",
    "rationale",
    "alternatives",
    "impact",
    "status",
    "meetingNoteId",
    "researchEntryId",
    "experimentId",
  ];

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  // Append to history on status change
  if (body.status) {
    const existing = await prisma.decision.findUnique({ where: { id } });
    if (existing && body.status !== existing.status) {
      const historyEntry = {
        date: new Date().toISOString(),
        previousStatus: existing.status,
        newStatus: body.status,
        changedBy: session.user?.name || "Unknown",
        changedById: session.user?.id || "",
      };
      updateData.history = { push: historyEntry };
    }
  }

  const decision = await prisma.decision.update({
    where: { id },
    data: updateData,
    include: {
      madeBy: true,
      meetingNote: true,
      researchEntry: { include: { user: true } },
      experiment: true,
      tasks: { include: { assignees: true } },
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(decision);
}
