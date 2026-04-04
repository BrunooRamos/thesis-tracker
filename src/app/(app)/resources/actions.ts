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
  const url = formData.get("url") as string;
  const description = formData.get("description") as string | null;
  const category = formData.get("category") as ResourceCategory;
  const pinned = formData.get("pinned") === "on";

  const resource = await prisma.resource.create({
    data: {
      name,
      url,
      description: description || undefined,
      category,
      pinned,
      addedById: session.user.id!,
    },
  });

  await logActivity("created_resource", "resource", resource.id, resource.name);
  revalidatePath("/resources");
  revalidatePath("/");
  return resource;
}

export async function updateResource(
  id: string,
  data: {
    name?: string;
    url?: string;
    description?: string | null;
    category?: ResourceCategory;
    pinned?: boolean;
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
  return resource;
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
