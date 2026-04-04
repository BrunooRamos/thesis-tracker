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
    },
  });

  await logActivity("created_decision", "decision", record.id, record.title);
  revalidatePath("/decisions");
  revalidatePath("/");
  return record;
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
  return record;
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
  return comment;
}
