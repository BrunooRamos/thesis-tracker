import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const FULL_INCLUDE = {
  phase: true,
  owners: true,
  tasks: { include: { assignees: true } },
  deliverables: { orderBy: { order: "asc" as const } },
  acceptanceCriteria: { orderBy: { order: "asc" as const } },
  comments: { include: { user: true }, orderBy: { createdAt: "asc" as const } },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: FULL_INCLUDE,
  });

  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(activity);
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
  const allowedFields = ["wbsCode", "name", "description", "status", "phaseId"];

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if ("startDate" in body) {
    updateData.startDate = body.startDate ? new Date(body.startDate) : null;
  }
  if ("endDate" in body) {
    updateData.endDate = body.endDate ? new Date(body.endDate) : null;
  }
  if ("ownerIds" in body && Array.isArray(body.ownerIds)) {
    const ids: string[] = body.ownerIds.slice(0, 3);
    updateData.owners = { set: ids.map((oid) => ({ id: oid })) };
  }

  const activity = await prisma.activity.update({
    where: { id },
    data: updateData,
    include: FULL_INCLUDE,
  });

  return NextResponse.json(activity);
}
