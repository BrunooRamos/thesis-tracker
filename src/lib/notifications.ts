import { prisma } from "./prisma";

export async function createNotification({
  userId,
  type,
  title,
  message,
  entityType,
  entityId,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}) {
  return prisma.notification.create({
    data: { userId, type, title, message, entityType, entityId },
  });
}
