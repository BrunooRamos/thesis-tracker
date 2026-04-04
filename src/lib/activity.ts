"use server";

import { prisma } from "./prisma";
import { auth } from "./auth";

export async function logActivity(
  action: string,
  entityType: string,
  entityId: string,
  entityTitle: string,
  metadata?: Record<string, string | number | boolean | null>
) {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.activityLog.create({
    data: {
      action,
      entityType,
      entityId,
      entityTitle,
      userId: session.user.id!,
      userName: session.user.name || "Unknown",
      metadata: metadata ?? undefined,
    },
  });
}
