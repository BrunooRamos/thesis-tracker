import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${(process.env.CRON_SECRET ?? "").trim()}`;
  if (authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Export all data
  const [users, phases, milestones, tasks, tags, research, experiments, decisions, meetings, resources, activities] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } }),
    prisma.phase.findMany({ include: { milestones: true } }),
    prisma.milestone.findMany(),
    prisma.task.findMany({ include: { assignees: { select: { id: true, name: true } }, tags: true, comments: { include: { user: { select: { name: true } } } } } }),
    prisma.tag.findMany(),
    prisma.researchEntry.findMany({ include: { user: { select: { name: true } }, comments: { include: { user: { select: { name: true } } } } } }),
    prisma.experiment.findMany({ include: { user: { select: { name: true } }, comments: { include: { user: { select: { name: true } } } } } }),
    prisma.decision.findMany({ include: { madeBy: { select: { name: true } }, comments: { include: { user: { select: { name: true } } } } } }),
    prisma.meetingNote.findMany({ include: { author: { select: { name: true } } } }),
    prisma.resource.findMany({ include: { addedBy: { select: { name: true } } } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    data: { users, phases, milestones, tasks, tags, research, experiments, decisions, meetings, resources, activities },
  };

  const json = JSON.stringify(backup, null, 2);
  const date = new Date().toISOString().split("T")[0];

  // Save to Vercel Blob
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 });
  }

  const blob = await put(`backups/backup-${date}.json`, json, {
    access: "private",
    token,
    contentType: "application/json",
  });

  // Notify admin
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const admin = users.find(u => u.role === "admin");
    if (admin) {
      await resend.emails.send({
        from: "Horizon Tracker <hola@horizon-thesis-um.online>",
        to: admin.email,
        subject: `Backup completado — ${date}`,
        html: `<p>Backup mensual completado. ${Object.values(backup.data).reduce((acc, arr) => acc + arr.length, 0)} registros exportados.</p><p>Guardado en: ${blob.url}</p>`,
      }).catch(console.error);
    }
  }

  return NextResponse.json({ url: blob.url, size: json.length, date });
}
