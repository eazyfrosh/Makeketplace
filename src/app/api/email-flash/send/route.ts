import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { requireReceiptEmailAccess } from "@/lib/receipt-email/access";
import { sendTransactionalReceipt } from "@/lib/receipt-email/provider";
import { renderReceiptEmail } from "@/lib/receipt-email/render";
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

    const sendId = `eds_${createHash("sha256").update(`${caller.uid}:${input.requestId}`).digest("hex").slice(0, 32)}`;
    const existing = await getReceiptSend(sendId);
    if (existing) return NextResponse.json({ send: existing });
    const template = await getReceiptTemplate(input.templateId);
    if (!template || template.userId !== caller.uid || template.schemaVersion !== 2) return NextResponse.json({ error: "Design not found." }, { status: 404 });
    await consumeReceiptEmailRateLimit(caller.uid);

    const now = new Date().toISOString();
    const send = {
      id: sendId,
      userId: caller.uid,
      templateId: template.id,
      templateName: template.name,
      category: template.category,
      recipientEmail,
      brandName: template.brandName,
      senderEmail: template.senderEmail,
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
      const providerEmailId = await sendTransactionalReceipt({ fromName: template.senderName, fromEmail: template.senderEmail, to: recipientEmail, subject: send.subject, html: renderReceiptEmail(template), idempotencyKey: sendId });
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
    if (message === "ACTIVE_SUBSCRIPTION_REQUIRED") return NextResponse.json({ error: "An active subscription is required for Email Designer." }, { status: 403 });
    console.error("[email-designer] send failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
