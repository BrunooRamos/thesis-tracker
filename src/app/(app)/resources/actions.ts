"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import type { ResourceCategory } from "@/types";

export async function createResource(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const url = formData.get("url") as string | null;
  const description = formData.get("description") as string | null;
  const category = formData.get("category") as ResourceCategory;
  const pinned = formData.get("pinned") === "on";
  const fileUrl = formData.get("fileUrl") as string | null;
  const fileName = formData.get("fileName") as string | null;
  const fileType = formData.get("fileType") as string | null;

  if (!url && !fileUrl) {
    throw new Error("Either a URL or a file upload is required");
  }

  const resource = await prisma.resource.create({
    data: {
      name,
      url: url || undefined,
      description: description || undefined,
      category,
      pinned,
      fileUrl: fileUrl || undefined,
      fileName: fileName || undefined,
      fileType: fileType || undefined,
      addedById: session.user.id!,
    },
  });

  await logActivity("created_resource", "resource", resource.id, resource.name);
  revalidatePath("/resources");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(resource));
}

export async function updateResource(
  id: string,
  data: {
    name?: string;
    url?: string;
    description?: string | null;
    category?: ResourceCategory;
    pinned?: boolean;
    fileUrl?: string | null;
    fileName?: string | null;
    fileType?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const resource = await prisma.resource.update({
    where: { id },
    data,
  });

  await logActivity("updated_resource", "resource", resource.id, resource.name);
  revalidatePath("/resources");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(resource));
}

export async function deleteResource(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) throw new Error("Resource not found");

  await prisma.resource.delete({ where: { id } });
  await logActivity("deleted_resource", "resource", id, resource.name);
  revalidatePath("/resources");
  revalidatePath("/");
}
