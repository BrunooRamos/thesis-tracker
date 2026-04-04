"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import type { TaskStatus, Priority } from "@/types";

export async function createTask(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const assigneeId = formData.get("assigneeId") as string | null;
  const phaseId = formData.get("phaseId") as string | null;
  const priority = (formData.get("priority") as Priority) || "MEDIUM";
  const description = formData.get("description") as string | null;
  const wbsCode = formData.get("wbsCode") as string | null;
  const dueDateStr = formData.get("dueDate") as string | null;
  const tagIds = formData.getAll("tagIds") as string[];

  const task = await prisma.task.create({
    data: {
      title,
      description: description || undefined,
      priority,
      wbsCode: wbsCode || undefined,
      dueDate: dueDateStr ? new Date(dueDateStr) : undefined,
      creatorId: session.user.id!,
      assigneeId: assigneeId || undefined,
      phaseId: phaseId || undefined,
      tags: tagIds.length > 0 ? { connect: tagIds.map((id) => ({ id })) } : undefined,
    },
  });

  await logActivity("created_task", "task", task.id, task.title);
  revalidatePath("/tasks");
  revalidatePath("/");
  return task;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  const action =
    status === "DONE"
      ? "completed_task"
      : status === "IN_PROGRESS"
      ? "started_task"
      : "updated_task";

  await logActivity(action, "task", task.id, task.title);
  revalidatePath("/tasks");
  revalidatePath("/");
  return task;
}

export async function updateTask(taskId: string, data: {
  title?: string;
  description?: string | null;
  priority?: Priority;
  assigneeId?: string | null;
  phaseId?: string | null;
  wbsCode?: string | null;
  dueDate?: string | null;
  status?: TaskStatus;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
    },
  });

  await logActivity("updated_task", "task", task.id, task.title);
  revalidatePath("/tasks");
  revalidatePath("/");
  return task;
}

export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");

  await prisma.task.delete({ where: { id: taskId } });
  await logActivity("deleted_task", "task", taskId, task.title);
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function addTaskComment(taskId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const comment = await prisma.comment.create({
    data: {
      content,
      userId: session.user.id!,
      taskId,
    },
    include: { user: true },
  });

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (task) {
    await logActivity("added_comment", "task", taskId, task.title);
  }

  revalidatePath("/tasks");
  return comment;
}
