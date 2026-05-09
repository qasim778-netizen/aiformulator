import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;
let initError: string | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    initError = "SMTP not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASS)";
    throw new Error(initError);
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // STARTTLS for 587, implicit TLS for 465
    auth: { user, pass },
  });

  return transporter;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function verifyEmailTransport(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isEmailConfigured()) {
      return { ok: false, error: "SMTP environment variables are not set" };
    }
    await getTransporter().verify();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER!;
  const tx = getTransporter();
  await tx.sendMail({
    from: `"AIFormulator" <${from}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text || stripHtml(opts.html),
    replyTo: opts.replyTo,
  });
}

function stripHtml(html: string): string {
  return html.replace(/<style[^>]*>.*?<\/style>/gis, "")
             .replace(/<[^>]+>/g, "")
             .replace(/\s+/g, " ")
             .trim();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── Branded email shell ──────────────────────────────────────────────
function shell(opts: { title: string; preheader?: string; bodyHtml: string }): string {
  const brandColor = "#0D9488"; // teal-600
  const preheader = opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(opts.preheader)}</div>` : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:linear-gradient(135deg,#ecfdf5 0%,#f0fdfa 100%);padding:28px 32px;border-bottom:1px solid #e5e7eb;">
            <table role="presentation" width="100%"><tr>
              <td style="vertical-align:middle;">
                <span style="display:inline-block;background:${brandColor};color:#fff;font-weight:700;font-size:20px;width:40px;height:40px;line-height:40px;text-align:center;border-radius:10px;vertical-align:middle;">A</span>
                <span style="margin-left:12px;font-size:20px;font-weight:700;color:#0f172a;vertical-align:middle;">AIFormulator</span>
              </td>
              <td align="right" style="vertical-align:middle;">
                <span style="font-size:12px;color:#6b7280;">Professional Formulation Intelligence</span>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr><td style="padding:36px 32px 28px 32px;">${opts.bodyHtml}</td></tr>
        <tr>
          <td style="padding:20px 32px 28px 32px;border-top:1px solid #f1f5f9;background:#fafafa;font-size:12px;color:#6b7280;line-height:1.6;">
            This message was sent by <strong>AIFormulator</strong>. If you have questions, reply to this email or contact
            <a href="mailto:support@aiformulator.net" style="color:${brandColor};text-decoration:none;">support@aiformulator.net</a>.<br>
            © ${new Date().getFullYear()} AIFormulator. All rights reserved.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Templates ────────────────────────────────────────────────────────
export function passwordResetEmail(opts: { resetUrl: string; firstName?: string | null; expiresInMinutes: number }): { subject: string; html: string } {
  const brandColor = "#0D9488";
  const greeting = opts.firstName ? `Hi ${escapeHtml(opts.firstName)},` : "Hi,";
  const html = shell({
    title: "Reset your AIFormulator password",
    preheader: `Click the secure link to reset your password. Expires in ${opts.expiresInMinutes} minutes.`,
    bodyHtml: `
      <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#0f172a;">Reset your password</h1>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">${greeting}</p>
      <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#374151;">
        We received a request to reset the password for your AIFormulator account. Click the button below to choose a new password. This link will expire in <strong>${opts.expiresInMinutes} minutes</strong>.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
        <tr><td align="center" style="border-radius:10px;background:${brandColor};">
          <a href="${opts.resetUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">Reset Password</a>
        </td></tr>
      </table>
      <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">Or copy and paste this link into your browser:</p>
      <p style="margin:0 0 24px 0;font-size:13px;color:${brandColor};word-break:break-all;"><a href="${opts.resetUrl}" style="color:${brandColor};text-decoration:underline;">${opts.resetUrl}</a></p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;font-size:13px;color:#475569;line-height:1.6;">
        <strong>Didn't request this?</strong> You can safely ignore this email — your password will not be changed.
      </div>
    `,
  });
  return { subject: "Reset your AIFormulator password", html };
}

export function contactNotificationEmail(opts: { name: string; email: string; subject: string; message: string }): { subject: string; html: string } {
  const html = shell({
    title: `New contact message: ${opts.subject}`,
    preheader: `From ${opts.name} <${opts.email}>`,
    bodyHtml: `
      <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#0f172a;">New contact form message</h1>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;color:#374151;margin-bottom:20px;">
        <tr><td style="padding:6px 0;width:90px;color:#6b7280;">Name</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(opts.name)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(opts.email)}" style="color:#0D9488;text-decoration:none;">${escapeHtml(opts.email)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Subject</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(opts.subject)}</td></tr>
      </table>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 18px;font-size:14px;color:#1f2937;line-height:1.7;white-space:pre-wrap;">${escapeHtml(opts.message)}</div>
      <p style="margin:20px 0 0 0;font-size:13px;color:#6b7280;">Reply directly to this email to respond to ${escapeHtml(opts.name)}.</p>
    `,
  });
  return { subject: `[Contact] ${opts.subject}`, html };
}
