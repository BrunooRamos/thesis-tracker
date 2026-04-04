"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import type { MeetingType } from "@/types";
import type { Prisma } from "@/generated/prisma/client";

export async function createMeetingNote(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const dateStr = formData.get("date") as string;
  const type = formData.get("type") as MeetingType;
  const attendeesStr = formData.get("attendees") as string | null;
  const summary = formData.get("summary") as string;
  const actionItemsStr = formData.get("actionItems") as string | null;
  const keyDecisions = formData.get("keyDecisions") as string | null;

  const attendees = attendeesStr
    ? attendeesStr
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
    : [];

  let actionItems: Prisma.InputJsonValue[] = [];
  if (actionItemsStr) {
    try {
      actionItems = JSON.parse(actionItemsStr);
    } catch {
      actionItems = [];
    }
  }

  const meeting = await prisma.meetingNote.create({
    data: {
      title,
      date: new Date(dateStr),
      type,
      attendees,
      summary,
      actionItems,
      keyDecisions: keyDecisions || undefined,
      authorId: session.user.id!,
    },
  });

  await logActivity("created_meeting", "meeting", meeting.id, meeting.title);
  revalidatePath("/meetings");
  revalidatePath("/");
  return meeting;
}

export async function updateMeetingNote(
  id: string,
  data: {
    title?: string;
    date?: string;
    type?: MeetingType;
    attendees?: string[];
    summary?: string;
    actionItems?: Record<string, unknown>[];
    keyDecisions?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.type !== undefined) updateData.type = data.type;
  if (data.attendees !== undefined) updateData.attendees = data.attendees;
  if (data.summary !== undefined) updateData.summary = data.summary;
  if (data.actionItems !== undefined) updateData.actionItems = data.actionItems;
  if (data.keyDecisions !== undefined) updateData.keyDecisions = data.keyDecisions;

  const meeting = await prisma.meetingNote.update({
    where: { id },
    data: updateData,
  });

  await logActivity("updated_meeting", "meeting", meeting.id, meeting.title);
  revalidatePath("/meetings");
  revalidatePath("/");
  return meeting;
}

export async function deleteMeetingNote(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const meeting = await prisma.meetingNote.findUnique({ where: { id } });
  if (!meeting) throw new Error("Meeting not found");

  await prisma.meetingNote.delete({ where: { id } });
  await logActivity("deleted_meeting", "meeting", id, meeting.title);
  revalidatePath("/meetings");
  revalidatePath("/");
}

export async function convertActionItemToTask(
  meetingId: string,
  actionItem: { task: string; assignee: string; dueDate?: string }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Find user by name for assignee
  let assigneeId: string | undefined;
  if (actionItem.assignee) {
    const user = await prisma.user.findFirst({
      where: {
        name: {
          contains: actionItem.assignee,
          mode: "insensitive",
        },
      },
    });
    if (user) assigneeId = user.id;
  }

  const task = await prisma.task.create({
    data: {
      title: actionItem.task,
      creatorId: session.user.id!,
      assigneeId: assigneeId || undefined,
      dueDate: actionItem.dueDate ? new Date(actionItem.dueDate) : undefined,
      description: `Creado desde reunión (ID: ${meetingId})`,
    },
  });

  await logActivity("created_task_from_meeting", "task", task.id, task.title, {
    meetingId,
  });

  revalidatePath("/meetings");
  revalidatePath("/tasks");
  revalidatePath("/");
  return task;
}
