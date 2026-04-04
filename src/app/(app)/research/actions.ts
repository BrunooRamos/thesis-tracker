"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import type { ResearchType, Relevance } from "@/types";

export async function createResearchEntry(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;
  const title = formData.get("title") as string;
  const type = formData.get("type") as ResearchType;
  const url = formData.get("url") as string | null;
  const authors = formData.get("authors") as string | null;
  const summary = formData.get("summary") as string;
  const keyFindings = formData.get("keyFindings") as string | null;
  const relevance = (formData.get("relevance") as Relevance) || "MEDIUM";
  const tagsStr = formData.get("tags") as string | null;
  const tags = tagsStr
    ? tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const resourceId = formData.get("resourceId") as string | null;

  const entry = await prisma.researchEntry.create({
    data: {
      title,
      type,
      url: url || undefined,
      authors: authors || undefined,
      summary,
      keyFindings: keyFindings || undefined,
      relevance,
      tags,
      userId,
      resourceId: resourceId || undefined,
    },
    include: { user: true, comments: { include: { user: true } } },
  });

  await logActivity("added_research", "research", entry.id, entry.title);
  revalidatePath("/research");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(entry));
}

export async function updateResearchEntry(
  id: string,
  data: {
    title?: string;
    type?: ResearchType;
    url?: string | null;
    authors?: string | null;
    summary?: string;
    keyFindings?: string | null;
    relevance?: Relevance;
    tags?: string[];
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const entry = await prisma.researchEntry.update({
    where: { id },
    data,
    include: { user: true, comments: { include: { user: true } } },
  });

  revalidatePath("/research");
  return JSON.parse(JSON.stringify(entry));
}

export async function deleteResearchEntry(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const entry = await prisma.researchEntry.findUnique({ where: { id } });
  if (!entry) throw new Error("Not found");

  await prisma.researchEntry.delete({ where: { id } });
  await logActivity("deleted_research", "research", id, entry.title);
  revalidatePath("/research");
  revalidatePath("/");
}

export async function addResearchComment(entryId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const comment = await prisma.comment.create({
    data: {
      content,
      userId: session.user.id!,
      researchEntryId: entryId,
    },
    include: { user: true },
  });

  const entry = await prisma.researchEntry.findUnique({ where: { id: entryId } });
  if (entry) {
    await logActivity("added_comment", "research", entryId, entry.title);
  }

  revalidatePath("/research");
  return JSON.parse(JSON.stringify(comment));
}
