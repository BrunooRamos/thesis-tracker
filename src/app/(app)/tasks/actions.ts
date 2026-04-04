"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { sendTaskAssignmentEmail } from "@/lib/email";
import type { TaskStatus, Priority } from "@/types";

export async function createTask(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify user exists in DB (session might have stale ID after reseed)
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) {
    throw new Error("Tu sesión expiró. Cerrá sesión y volvé a ingresar.");
  }

  const title = formData.get("title") as string;
  const assigneeIdsRaw = formData.get("assigneeIds") as string | null;
  const assigneeIds = assigneeIdsRaw ? assigneeIdsRaw.split(",").map(id => id.trim()).filter(Boolean) : [];
  const phaseId = formData.get("phaseId") as string | null;
  const priority = (formData.get("priority") as Priority) || "MEDIUM";
  const description = formData.get("description") as string | null;
  const wbsCode = formData.get("wbsCode") as string | null;
  const dueDateStr = formData.get("dueDate") as string | null;
  const tagIds = formData.getAll("tagIds") as string[];
  const resourceId = formData.get("resourceId") as string | null;
  const researchEntryId = formData.get("researchEntryId") as string | null;

  const task = await prisma.task.create({
    data: {
      title,
      description: description || undefined,
      priority,
      wbsCode: wbsCode || undefined,
      dueDate: dueDateStr ? new Date(dueDateStr) : undefined,
      creatorId: session.user.id!,
      assignees: assigneeIds.length > 0 ? { connect: assigneeIds.map((id) => ({ id })) } : undefined,
      phaseId: phaseId || undefined,
      resourceId: resourceId || undefined,
      researchEntryId: researchEntryId || undefined,
      tags: tagIds.length > 0 ? { connect: tagIds.map((id) => ({ id })) } : undefined,
    },
  });

  await logActivity("created_task", "task", task.id, task.title);

  // Send email notification to assignees
  if (assigneeIds.length > 0) {
    const assignees = await prisma.user.findMany({ where: { id: { in: assigneeIds } } });
    const baseUrl = "https://horizon-thesis-um.online";
    for (const assignee of assignees) {
      sendTaskAssignmentEmail({
        to: assignee.email,
        assigneeName: assignee.name,
        taskTitle: title,
        taskDescription: description || undefined,
        creatorName: session.user.name || "Alguien",
        priority,
        dueDate: dueDateStr || undefined,
        taskUrl: `${baseUrl}/tasks`,
      }).catch(console.error); // Fire and forget, don't block task creation
    }
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  // Return plain serializable object
  return JSON.parse(JSON.stringify(task)) as { id: string; title: string };
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
  assigneeIds?: string[];
  phaseId?: string | null;
  wbsCode?: string | null;
  dueDate?: string | null;
  status?: TaskStatus;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { assigneeIds, ...rest } = data;
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...rest,
      dueDate: rest.dueDate ? new Date(rest.dueDate) : rest.dueDate === null ? null : undefined,
      ...(assigneeIds !== undefined ? { assignees: { set: assigneeIds.map(id => ({ id })) } } : {}),
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
  return JSON.parse(JSON.stringify(comment));
}
