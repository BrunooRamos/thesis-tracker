import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [users, tasksCompleted, tasksCreated, researchAdded, decisionsCount, meetingsCount, upcomingMilestones] = await Promise.all([
    prisma.user.findMany(),
    prisma.task.count({ where: { status: "DONE", updatedAt: { gte: oneWeekAgo } } }),
    prisma.task.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.researchEntry.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.decision.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.meetingNote.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.milestone.findMany({
      where: { status: { not: "COMPLETED" }, dueDate: { gte: new Date(), lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) } },
      orderBy: { dueDate: "asc" },
      include: { phase: true },
    }),
  ]);

  // Build email HTML
  const milestonesHtml = upcomingMilestones.map(m =>
    `<li>${m.code}: ${m.name} — ${new Date(m.dueDate).toLocaleDateString("es")}${m.isFaculty ? " 🎓" : ""}</li>`
  ).join("");

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; background: #f2f0ea; padding: 32px;">
      <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #d3cfc6;">
        <h2 style="margin: 0 0 4px; font-size: 18px; color: #1a1c24;">Resumen Semanal</h2>
        <p style="margin: 0 0 20px; font-size: 12px; color: #535766;">Horizon Thesis Tracker — Semana del ${new Date().toLocaleDateString("es")}</p>

        <div style="background: #f2f0ea; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
          <table style="width: 100%; font-size: 13px; color: #383c48;">
            <tr><td style="padding: 4px 0;">Tareas completadas</td><td style="text-align: right; font-weight: 600; color: #10B981;">${tasksCompleted}</td></tr>
            <tr><td style="padding: 4px 0;">Tareas creadas</td><td style="text-align: right; font-weight: 600; color: #ff7c11;">${tasksCreated}</td></tr>
            <tr><td style="padding: 4px 0;">Research agregado</td><td style="text-align: right; font-weight: 600; color: #9a4a00;">${researchAdded}</td></tr>
            <tr><td style="padding: 4px 0;">Decisiones</td><td style="text-align: right; font-weight: 600; color: #f59e0b;">${decisionsCount}</td></tr>
            <tr><td style="padding: 4px 0;">Reuniones</td><td style="text-align: right; font-weight: 600; color: #ff7c11;">${meetingsCount}</td></tr>
          </table>
        </div>

        ${upcomingMilestones.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 13px; color: #1a1c24; margin: 0 0 8px;">Próximos hitos (14 días)</h3>
            <ul style="font-size: 12px; color: #535766; padding-left: 16px; margin: 0;">${milestonesHtml}</ul>
          </div>
        ` : ""}

        <a href="https://horizon-thesis-um.online" style="display: inline-block; background: #ff7c11; color: white; text-decoration: none; padding: 10px 24px; border-radius: 999px; font-size: 13px; font-weight: 500;">
          Ir al Tracker
        </a>
      </div>
      <p style="text-align: center; font-size: 10px; color: #535766; margin-top: 16px;">Horizon Thesis Tracker</p>
    </div>
  `;

  // Send to all users
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    for (const user of users) {
      try {
        await resend.emails.send({
          from: "Horizon Tracker <hola@horizon-thesis-um.online>",
          to: user.email,
          subject: `Resumen semanal — ${tasksCompleted} tareas completadas`,
          html,
        });
      } catch (err) {
        console.error(`Failed to send digest to ${user.email}:`, err);
      }
    }
  }

  return NextResponse.json({
    sent: users.length,
    stats: { tasksCompleted, tasksCreated, researchAdded, decisionsCount, meetingsCount, upcomingMilestones: upcomingMilestones.length }
  });
}
