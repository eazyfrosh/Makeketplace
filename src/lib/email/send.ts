import { Resend } from "resend";

export const isEmailConfigured = Boolean(process.env.RESEND_API_KEY);

const resend = isEmailConfigured ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "Nexova <onboarding@resend.dev>";

export interface SentEmailRecord {
  id: string;
  to: string;
  subject: string;
  html: string;
  createdAt: string;
}

declare global {
  var __nexovaEmailLog: SentEmailRecord[] | undefined;
}

function demoLog(): SentEmailRecord[] {
  if (!global.__nexovaEmailLog) global.__nexovaEmailLog = [];
  return global.__nexovaEmailLog;
}

export function getRecentDemoEmails(limit = 20): SentEmailRecord[] {
  return demoLog().slice(-limit).reverse();
}

/**
 * Sends an email via Resend when RESEND_API_KEY is configured. Otherwise logs
 * to the console and an in-memory demo log (visible in the admin console) so
 * the flow stays fully testable with zero email-provider setup, matching the
 * app's existing "demo mode" fallback pattern for payments.
 */
export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  if (isEmailConfigured && resend) {
    await resend.emails.send({ from: FROM, to: params.to, subject: params.subject, html: params.html });
    return;
  }

  console.warn(
    `[email:demo] RESEND_API_KEY not set — logging instead of sending. To: ${params.to} | Subject: ${params.subject}`,
  );
  demoLog().push({
    id: `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    to: params.to,
    subject: params.subject,
    html: params.html,
    createdAt: new Date().toISOString(),
  });
}
