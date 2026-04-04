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

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: true,
      creator: true,
      tags: true,
      phase: true,
      resource: true,
      researchEntry: true,
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(task);
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
    "description",
    "status",
    "priority",
    "assigneeId",
    "phaseId",
    "wbsCode",
    "resourceId",
    "researchEntryId",
  ];

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if ("dueDate" in body) {
    updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      assignee: true,
      creator: true,
      tags: true,
      phase: true,
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(task);
}
