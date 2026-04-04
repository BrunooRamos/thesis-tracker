"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import type { DecisionStatus } from "@/types";

export async function createDecision(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const context = formData.get("context") as string;
  const decision = formData.get("decision") as string;
  const rationale = formData.get("rationale") as string;
  const alternatives = formData.get("alternatives") as string | null;
  const impact = formData.get("impact") as string | null;
  const status = (formData.get("status") as DecisionStatus) || "PROPOSED";
  const meetingNoteId = formData.get("meetingNoteId") as string | null;
  const researchEntryId = formData.get("researchEntryId") as string | null;
  const experimentId = formData.get("experimentId") as string | null;

  const record = await prisma.decision.create({
    data: {
      title,
      context,
      decision,
      rationale,
      alternatives: alternatives || undefined,
      impact: impact || undefined,
      status,
      madeById: session.user.id!,
      meetingNoteId: meetingNoteId || undefined,
      researchEntryId: researchEntryId || undefined,
      experimentId: experimentId || undefined,
    },
  });

  await logActivity("created_decision", "decision", record.id, record.title);
  revalidatePath("/decisions");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(record));
}

export async function updateDecision(
  id: string,
  data: {
    title?: string;
    context?: string;
    decision?: string;
    rationale?: string;
    alternatives?: string | null;
    impact?: string | null;
    status?: DecisionStatus;
    meetingNoteId?: string | null;
    researchEntryId?: string | null;
    experimentId?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const record = await prisma.decision.update({
    where: { id },
    data,
  });

  await logActivity("updated_decision", "decision", record.id, record.title);
  revalidatePath("/decisions");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(record));
}

export async function deleteDecision(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const record = await prisma.decision.findUnique({ where: { id } });
  if (!record) throw new Error("Decision not found");

  await prisma.decision.delete({ where: { id } });
  await logActivity("deleted_decision", "decision", id, record.title);
  revalidatePath("/decisions");
  revalidatePath("/");
}

export async function addDecisionComment(decisionId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const comment = await prisma.comment.create({
    data: {
      content,
      userId: session.user.id!,
      decisionId,
    },
    include: { user: true },
  });

  const record = await prisma.decision.findUnique({ where: { id: decisionId } });
  if (record) {
    await logActivity("added_comment", "decision", decisionId, record.title);
  }

  revalidatePath("/decisions");
  return JSON.parse(JSON.stringify(comment));
}

export async function createTaskFromDecision(
  decisionId: string,
  data: { title: string; assigneeId?: string; dueDate?: string }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const decision = await prisma.decision.findUnique({ where: { id: decisionId } });
  if (!decision) throw new Error("Decision not found");

  const description = `> Decisión: **${decision.title}**\n\n${decision.decision}`;

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description,
      creatorId: session.user.id!,
      assignees: data.assigneeId ? { connect: [{ id: data.assigneeId }] } : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      decisionId,
    },
    include: { assignees: true },
  });

  await logActivity("created_task", "task", task.id, task.title);
  revalidatePath("/decisions");
  revalidatePath("/tasks");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(task));
}
