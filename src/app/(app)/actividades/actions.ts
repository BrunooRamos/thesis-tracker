"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import type { ActivityStatus } from "@/types";

const MAX_OWNERS = 3;

function revalidateAll() {
  revalidatePath("/actividades");
  revalidatePath("/");
  revalidatePath("/tasks");
}

// ──────────────────────────────────────────────────────────
// Activity CRUD
// ──────────────────────────────────────────────────────────

export async function createActivity(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const wbsCode = (formData.get("wbsCode") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const phaseId = formData.get("phaseId") as string;
  const status = ((formData.get("status") as ActivityStatus) || "NOT_STARTED");
  const startDateStr = formData.get("startDate") as string | null;
  const endDateStr = formData.get("endDate") as string | null;
  const ownerIdsRaw = formData.get("ownerIds") as string | null;
  const ownerIds = ownerIdsRaw
    ? ownerIdsRaw.split(",").map((id) => id.trim()).filter(Boolean).slice(0, MAX_OWNERS)
    : [];

  if (!wbsCode || !name || !phaseId) {
    throw new Error("wbsCode, name y phaseId son obligatorios");
  }

  const activity = await prisma.activity.create({
    data: {
      wbsCode,
      name,
      description: description || undefined,
      phaseId,
      status,
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
      owners: ownerIds.length > 0 ? { connect: ownerIds.map((id) => ({ id })) } : undefined,
    },
  });

  await logActivity("created_activity", "activity", activity.id, `${activity.wbsCode} · ${activity.name}`);
  revalidateAll();
  return JSON.parse(JSON.stringify(activity));
}

export async function updateActivity(
  id: string,
  data: {
    wbsCode?: string;
    name?: string;
    description?: string | null;
    phaseId?: string;
    status?: ActivityStatus;
    startDate?: string | null;
    endDate?: string | null;
    ownerIds?: string[];
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const updateData: Record<string, unknown> = {};
  if (data.wbsCode !== undefined) updateData.wbsCode = data.wbsCode;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.phaseId !== undefined) updateData.phaseId = data.phaseId;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.startDate !== undefined) {
    updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  }
  if (data.endDate !== undefined) {
    updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  }
  if (data.ownerIds !== undefined) {
    const ids = data.ownerIds.slice(0, MAX_OWNERS);
    updateData.owners = { set: ids.map((oid) => ({ id: oid })) };
  }

  const activity = await prisma.activity.update({
    where: { id },
    data: updateData,
  });

  revalidateAll();
  return JSON.parse(JSON.stringify(activity));
}

export async function deleteActivity(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) throw new Error("Actividad no encontrada");

  await prisma.activity.delete({ where: { id } });
  await logActivity("deleted_activity", "activity", id, `${activity.wbsCode} · ${activity.name}`);
  revalidateAll();
}

// ──────────────────────────────────────────────────────────
// Deliverables
// ──────────────────────────────────────────────────────────

export async function addDeliverable(
  activityId: string,
  data: { title: string; description?: string | null; fileUrl?: string | null; fileName?: string | null; fileType?: string | null }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const count = await prisma.deliverable.count({ where: { activityId } });
  const d = await prisma.deliverable.create({
    data: {
      activityId,
      title: data.title,
      description: data.description || undefined,
      fileUrl: data.fileUrl || undefined,
      fileName: data.fileName || undefined,
      fileType: data.fileType || undefined,
      order: count,
    },
  });
  revalidateAll();
  return JSON.parse(JSON.stringify(d));
}

export async function updateDeliverable(
  id: string,
  data: { title?: string; description?: string | null; fileUrl?: string | null; fileName?: string | null; fileType?: string | null }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const d = await prisma.deliverable.update({ where: { id }, data });
  revalidateAll();
  return JSON.parse(JSON.stringify(d));
}

export async function deleteDeliverable(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.deliverable.delete({ where: { id } });
  revalidateAll();
}

// ──────────────────────────────────────────────────────────
// Acceptance Criteria
// ──────────────────────────────────────────────────────────

export async function addCriterion(activityId: string, text: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const count = await prisma.acceptanceCriterion.count({ where: { activityId } });
  const c = await prisma.acceptanceCriterion.create({
    data: { activityId, text, order: count },
  });
  revalidateAll();
  return JSON.parse(JSON.stringify(c));
}

export async function toggleCriterion(id: string, done: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const c = await prisma.acceptanceCriterion.update({ where: { id }, data: { done } });
  revalidateAll();
  return JSON.parse(JSON.stringify(c));
}

export async function updateCriterionText(id: string, text: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const c = await prisma.acceptanceCriterion.update({ where: { id }, data: { text } });
  revalidateAll();
  return JSON.parse(JSON.stringify(c));
}

export async function deleteCriterion(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.acceptanceCriterion.delete({ where: { id } });
  revalidateAll();
}

// ──────────────────────────────────────────────────────────
// Link task to activity
// ──────────────────────────────────────────────────────────

export async function linkTaskToActivity(taskId: string, activityId: string | null) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.task.update({ where: { id: taskId }, data: { activityId } });
  revalidateAll();
}

// ──────────────────────────────────────────────────────────
// Comments
// ──────────────────────────────────────────────────────────

export async function addActivityComment(activityId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const comment = await prisma.comment.create({
    data: {
      content,
      userId: session.user.id!,
      activityId,
    },
    include: { user: true },
  });

  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (activity) {
    await logActivity("added_comment", "activity", activityId, `${activity.wbsCode} · ${activity.name}`);
  }
  revalidateAll();
  return JSON.parse(JSON.stringify(comment));
}
