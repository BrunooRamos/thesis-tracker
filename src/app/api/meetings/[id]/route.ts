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

  const meeting = await prisma.meetingNote.findUnique({
    where: { id },
    include: { author: true },
  });

  if (!meeting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(meeting);
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
    "date",
    "type",
    "attendees",
    "summary",
    "actionItems",
    "keyDecisions",
    "attachments",
  ];

  for (const field of allowedFields) {
    if (field in body) {
      if (field === "date") {
        updateData[field] = new Date(body[field]);
      } else {
        updateData[field] = body[field];
      }
    }
  }

  const meeting = await prisma.meetingNote.update({
    where: { id },
    data: updateData,
    include: { author: true },
  });

  return NextResponse.json(meeting);
}
