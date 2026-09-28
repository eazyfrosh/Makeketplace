import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { requireReceiptEmailAccess } from "@/lib/receipt-email/access";
import { emailDomainProvider } from "@/lib/email-domains/provider";
import { consumeEmailDomainSendQuota, getEmailDomainForUser, getSenderIdentity, isRecipientSuppressed } from "@/lib/email-domains/store";
import { renderReceiptEmail, renderReceiptEmailText } from "@/lib/receipt-email/render";
import { consumeReceiptEmailRateLimit, createReceiptSend, getReceiptSend, getReceiptTemplate, logReceiptEmailAudit, updateReceiptSend } from "@/lib/receipt-email/store";
import { receiptSendInputSchema } from "@/lib/receipt-email/validation";
import { verifyCaller } from "@/lib/licensing/verify-auth";

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    await requireReceiptEmailAccess(caller);
    const parsed = receiptSendInputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid send request." }, { status: 400 });
    const input = parsed.data;
    const recipientEmail = input.mode === "test" ? caller.email.trim().toLowerCase() : input.recipientEmail?.trim().toLowerCase();
    if (!recipientEmail) return NextResponse.json({ error: input.mode === "test" ? "Your signed-in account has no email address." : "Recipient email is required." }, { status: 400 });
    if (input.mode === "delivery" && !input.recipientConsentConfirmed) return NextResponse.json({ error: "Confirm that the recipient consented to receive this email." }, { status: 400 });
    if (await isRecipientSuppressed(caller.uid, recipientEmail)) return NextResponse.json({ error: "This recipient is suppressed after a bounce or spam complaint." }, { status: 409 });

    const sendId = `eds_${createHash("sha256").update(`${caller.uid}:${input.requestId}`).digest("hex").slice(0, 32)}`;
    const existing = await getReceiptSend(sendId);
    if (existing) return NextResponse.json({ send: existing });
    const template = await getReceiptTemplate(input.templateId);
    if (!template || template.userId !== caller.uid || template.schemaVersion !== 2) return NextResponse.json({ error: "Design not found." }, { status: 404 });
    const sender = await getSenderIdentity(input.senderIdentityId);
    if (!sender || sender.userId !== caller.uid || !sender.enabled) return NextResponse.json({ error: "Select a verified sender that belongs to your account." }, { status: 403 });
    const emailDomain = await getEmailDomainForUser(sender.emailDomainId, caller.uid);
    if (!emailDomain || emailDomain.domainId !== sender.domainId || emailDomain.domain !== sender.domain || emailDomain.status !== "ready" || emailDomain.suspended) return NextResponse.json({ error: "This sender domain is not verified or sending has been suspended." }, { status: 403 });
    if (sender.address !== `${sender.localPart}@${emailDomain.domain}`) return NextResponse.json({ error: "The sender identity is invalid." }, { status: 403 });
    if (!emailDomainProvider.isConfigured()) return NextResponse.json({ error: "Email delivery is not configured." }, { status: 503 });
    await consumeReceiptEmailRateLimit(caller.uid);
    await consumeEmailDomainSendQuota(emailDomain.id, caller.uid);

    const now = new Date().toISOString();
    const send = {
      id: sendId,
      userId: caller.uid,
      templateId: template.id,
      templateName: template.name,
      category: template.category,
      recipientEmail,
      brandName: template.brandName,
      senderEmail: sender.address,
      senderIdentityId: sender.id,
      domainId: sender.domainId,
      emailDomainId: emailDomain.id,
      senderDisplayName: sender.displayName,
      replyTo: sender.replyTo,
      subject: input.mode === "test" ? `[TEST] ${template.subject}` : template.subject,
      sendMode: input.mode,
      recipientConsentConfirmed: input.mode === "test" || input.recipientConsentConfirmed,
      provider: "resend" as const,
      providerEmailId: null,
      status: "sending" as const,
      error: null,
      createdAt: now,
      updatedAt: now,
    };
    await createReceiptSend(send);
    try {
      const result = await emailDomainProvider.sendEmail({ fromName: sender.displayName, from: sender.address, replyTo: sender.replyTo, to: recipientEmail, subject: send.subject, html: renderReceiptEmail(template), text: renderReceiptEmailText(template), idempotencyKey: sendId });
      const providerEmailId = result.messageId;
      const completed = { ...send, providerEmailId, status: "sent" as const, updatedAt: new Date().toISOString() };
      await updateReceiptSend(sendId, completed);
      await logReceiptEmailAudit({ actorId: caller.uid, action: input.mode === "test" ? "email.test_sent" : "email.sent", targetId: sendId, recipientEmail, consentConfirmed: completed.recipientConsentConfirmed });
      return NextResponse.json({ send: completed });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The email could not be sent.";
      await updateReceiptSend(sendId, { status: "failed", error: message, updatedAt: new Date().toISOString() });
      await logReceiptEmailAudit({ actorId: caller.uid, action: "email.failed", targetId: sendId, error: message });
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "The email could not be sent.";
    if (message === "RATE_LIMITED") return NextResponse.json({ error: "Hourly Email Designer sending limit reached. Try again later." }, { status: 429 });
    if (message === "DOMAIN_RATE_LIMITED") return NextResponse.json({ error: "This domain's hourly sending limit has been reached." }, { status: 429 });
    if (message === "EMAIL_DOMAIN_NOT_READY") return NextResponse.json({ error: "The selected sender domain is not ready." }, { status: 409 });
    if (message === "ACTIVE_SUBSCRIPTION_REQUIRED") return NextResponse.json({ error: "An active subscription is required for Email Designer." }, { status: 403 });
    console.error("[email-designer] send failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
