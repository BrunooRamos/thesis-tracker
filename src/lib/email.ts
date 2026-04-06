import { marked } from "marked";

// Convert markdown to inline-styled HTML for emails
function renderMarkdown(md: string): string {
  const html = marked.parse(md, { async: false }) as string;
  // Add inline styles to common elements (email clients don't support CSS classes)
  return html
    .replace(/<h1>/g, '<h1 style="font-size: 16px; font-weight: 700; color: #1a1c24; margin: 12px 0 6px;">')
    .replace(/<h2>/g, '<h2 style="font-size: 14px; font-weight: 600; color: #1a1c24; margin: 10px 0 4px;">')
    .replace(/<h3>/g, '<h3 style="font-size: 13px; font-weight: 600; color: #1a1c24; margin: 8px 0 4px;">')
    .replace(/<p>/g, '<p style="margin: 6px 0; font-size: 12px; color: #535766; line-height: 1.5;">')
    .replace(/<ul>/g, '<ul style="margin: 6px 0; padding-left: 20px; font-size: 12px; color: #535766;">')
    .replace(/<ol>/g, '<ol style="margin: 6px 0; padding-left: 20px; font-size: 12px; color: #535766;">')
    .replace(/<li>/g, '<li style="margin: 2px 0;">')
    .replace(/<strong>/g, '<strong style="font-weight: 600; color: #1a1c24;">')
    .replace(/<em>/g, '<em style="font-style: italic;">')
    .replace(/<code>/g, '<code style="background: #e9e7df; padding: 1px 5px; border-radius: 3px; font-family: monospace; font-size: 11px; color: #9a4a00;">')
    .replace(/<pre>/g, '<pre style="background: #1a1c24; color: #e9e7df; padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 11px; margin: 8px 0;">')
    .replace(/<blockquote>/g, '<blockquote style="border-left: 3px solid #ff7c11; padding-left: 10px; color: #535766; margin: 8px 0; font-style: italic;">')
    .replace(/<a /g, '<a style="color: #ff7c11; text-decoration: underline;" ')
    .replace(/<hr>/g, '<hr style="border: none; border-top: 1px solid #d3cfc6; margin: 10px 0;">');
}

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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("Email skipped: RESEND_API_KEY not configured");
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const priorityLabels: Record<string, string> = {
    LOW: "Baja",
    MEDIUM: "Media",
    HIGH: "Alta",
    URGENT: "Urgente",
  };

  const descriptionHtml = taskDescription ? renderMarkdown(taskDescription) : "";

  try {
    const result = await resend.emails.send({
      from: "Horizon Tracker <hola@horizon-thesis-um.online>",
      to,
      subject: `Nueva tarea asignada: ${taskTitle}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; background: #f2f0ea; padding: 32px;">
          <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #d3cfc6;">
            <div style="margin-bottom: 16px;">
              <span style="font-size: 14px; font-weight: 600; color: #1a1c24;">Horizon Thesis Tracker</span>
            </div>

            <h2 style="margin: 0 0 4px; font-size: 18px; color: #1a1c24;">Nueva tarea asignada</h2>
            <p style="margin: 0 0 16px; font-size: 13px; color: #535766;">
              Hola ${assigneeName}, ${creatorName} te asignó una tarea
            </p>

            <div style="background: #f2f0ea; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <h3 style="margin: 0 0 8px; font-size: 15px; color: #1a1c24; font-weight: 600;">${taskTitle}</h3>
              ${descriptionHtml ? `<div style="margin: 8px 0; padding: 12px; background: white; border-radius: 8px; border: 1px solid #d3cfc6;">${descriptionHtml}</div>` : ""}
              <p style="margin: 8px 0 0; font-size: 11px;">
                <span style="color: #ff7c11; font-weight: 600;">Prioridad: ${priorityLabels[priority] || priority}</span>
                ${dueDate ? ` · <span style="color: #535766;">Fecha: ${new Date(dueDate).toLocaleDateString("es")}</span>` : ""}
              </p>
            </div>

            <a href="${taskUrl}" style="display: inline-block; background: #ff7c11; color: white; text-decoration: none; padding: 10px 24px; border-radius: 999px; font-size: 13px; font-weight: 500;">
              Ver tarea
            </a>
          </div>

          <p style="text-align: center; font-size: 10px; color: #535766; margin-top: 16px;">
            Horizon Thesis Tracker
          </p>
        </div>
      `,
    });
    console.log("Email sent:", result);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
