"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { hashSync } from "bcryptjs";

// --- PHASES ---
export async function updatePhase(
  phaseId: string,
  data: {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    progress?: number;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.phase.update({
    where: { id: phaseId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
      ...(data.status && { status: data.status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" }),
      ...(data.progress !== undefined && { progress: data.progress }),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

// --- MILESTONES ---
export async function updateMilestone(
  milestoneId: string,
  data: {
    name?: string;
    dueDate?: string;
    status?: string;
    isFaculty?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
      ...(data.status && { status: data.status as "PENDING" | "AT_RISK" | "COMPLETED" }),
      ...(data.isFaculty !== undefined && { isFaculty: data.isFaculty }),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function createMilestone(data: {
  code: string;
  name: string;
  dueDate: string;
  phaseId: string;
  isFaculty: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.milestone.create({
    data: {
      code: data.code,
      name: data.name,
      dueDate: new Date(data.dueDate),
      phaseId: data.phaseId,
      isFaculty: data.isFaculty,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function deleteMilestone(milestoneId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.milestone.delete({ where: { id: milestoneId } });
  revalidatePath("/settings");
  revalidatePath("/");
}

// --- TEAM ---
export async function updateUser(
  userId: string,
  data: { name?: string; email?: string; role?: string }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.role && { role: data.role }),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function addUser(data: { name: string; email: string; role: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: "",
      needsSetup: true,
      role: data.role,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function resetUserPassword(userId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: userId },
    data: { password: "", needsSetup: true },
  });

  revalidatePath("/settings");
}

// --- TAGS ---
export async function createTag(data: { name: string; color: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.tag.create({ data });
  revalidatePath("/settings");
  revalidatePath("/tasks");
}

export async function deleteTag(tagId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.tag.delete({ where: { id: tagId } });
  revalidatePath("/settings");
  revalidatePath("/tasks");
}
