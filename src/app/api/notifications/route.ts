import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id, read: false },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    notifications,
    unreadCount: notifications.length,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { ids } = body as { ids: string[] };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: {
      id: { in: ids },
      userId: session.user.id,
    },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
