"use server";

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendTaskAssignmentEmail({
  to,
  assigneeName,
  taskTitle,
  taskDescription,
  creatorName,
  priority,
  dueDate,
  taskUrl,
}: {
  to: string;
  assigneeName: string;
  taskTitle: string;
  taskDescription?: string;
  creatorName: string;
  priority: string;
  dueDate?: string;
  taskUrl: string;
}) {
  if (!resend) {
    console.log("Email skipped: RESEND_API_KEY not configured");
    return;
  }

  const priorityLabels: Record<string, string> = {
    LOW: "Baja",
    MEDIUM: "Media",
    HIGH: "Alta",
    URGENT: "\ud83d\udd34 Urgente",
  };

  try {
    await resend.emails.send({
      from: "Horizon Tracker <onboarding@resend.dev>",
      to,
      subject: `Nueva tarea asignada: ${taskTitle}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; background: #f2f0ea; padding: 32px;">
          <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #d3cfc6;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
              <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #ff7c11, #ff9a3e); display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-weight: bold; font-size: 14px;">H</span>
              </div>
              <span style="font-size: 14px; font-weight: 600; color: #1a1c24;">Horizon Thesis Tracker</span>
            </div>

            <h2 style="margin: 0 0 4px; font-size: 18px; color: #1a1c24;">Nueva tarea asignada</h2>
            <p style="margin: 0 0 16px; font-size: 13px; color: #535766;">
              ${creatorName} te asigno una tarea
            </p>

            <div style="background: #f2f0ea; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <h3 style="margin: 0 0 8px; font-size: 15px; color: #1a1c24; font-weight: 600;">${taskTitle}</h3>
              ${taskDescription ? `<p style="margin: 0 0 8px; font-size: 12px; color: #535766; line-height: 1.5;">${taskDescription.slice(0, 200)}${taskDescription.length > 200 ? '...' : ''}</p>` : ''}
              <div style="display: flex; gap: 12px; font-size: 11px;">
                <span style="color: #ff7c11; font-weight: 600;">Prioridad: ${priorityLabels[priority] || priority}</span>
                ${dueDate ? `<span style="color: #535766;">Fecha: ${new Date(dueDate).toLocaleDateString('es')}</span>` : ''}
              </div>
            </div>

            <a href="${taskUrl}" style="display: inline-block; background: #ff7c11; color: white; text-decoration: none; padding: 10px 24px; border-radius: 999px; font-size: 13px; font-weight: 500;">
              Ver tarea →
            </a>
          </div>

          <p style="text-align: center; font-size: 10px; color: #535766; margin-top: 16px;">
            Horizon Thesis Tracker · Proyecto de Fin de Carrera 2026
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
