import "server-only";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

function domainOf(email: string) {
  return email.split("@").at(-1)?.toLowerCase() ?? "";
}

export async function sendTransactionalReceipt(input: { fromName: string; fromEmail: string; to: string; subject: string; html: string; idempotencyKey: string }) {
  if (!resend) throw new Error("Transactional email is not configured.");
  const senderDomain = domainOf(input.fromEmail);
  const domains = await resend.domains.list();
  if (domains.error) throw new Error("Could not verify the sender domain with the email provider.");
  const verified = domains.data.data.some((domain) => domain.name.toLowerCase() === senderDomain && domain.status === "verified");
  if (!verified) throw new Error(`The sender domain ${senderDomain || "is missing"} is not verified in Resend.`);
  const result = await resend.emails.send({
    from: `${input.fromName.replace(/[<>]/g, "")} <${input.fromEmail}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
  }, { idempotencyKey: input.idempotencyKey });
  if (result.error || !result.data?.id) throw new Error(result.error?.message ?? "The email provider rejected this message.");
  return result.data.id;
}

export function verifyResendWebhook(payload: string, headers: Headers) {
  if (!resend || !process.env.RESEND_WEBHOOK_SECRET) throw new Error("Email Designer webhooks are not configured.");
  return resend.webhooks.verify({
    payload,
    webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
    headers: {
      id: headers.get("svix-id") ?? "",
      timestamp: headers.get("svix-timestamp") ?? "",
      signature: headers.get("svix-signature") ?? "",
    },
  });
}
