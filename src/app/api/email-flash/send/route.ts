import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { requireReceiptEmailAccess } from "@/lib/receipt-email/access";
import { sendTransactionalReceipt } from "@/lib/receipt-email/provider";
import { renderReceiptEmail } from "@/lib/receipt-email/render";
import { consumeReceiptEmailRateLimit, createReceiptSend, getReceiptSend, getReceiptTemplate, logReceiptEmailAudit, updateReceiptSend } from "@/lib/receipt-email/store";
import { getReceiptTransaction } from "@/lib/receipt-email/transactions";
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
    const sendId = `efs_${createHash("sha256").update(`${caller.uid}:${input.requestId}`).digest("hex").slice(0, 32)}`;
    const existing = await getReceiptSend(sendId);
    if (existing) return NextResponse.json({ send: existing });

    const [template, transaction] = await Promise.all([
      getReceiptTemplate(input.templateId),
      getReceiptTransaction(caller.uid, input.transactionId),
    ]);
    if (!template || template.userId !== caller.uid) return NextResponse.json({ error: "Template not found." }, { status: 404 });
    if (!transaction) return NextResponse.json({ error: "Choose a genuine completed EazyTools transaction." }, { status: 400 });
    await consumeReceiptEmailRateLimit(caller.uid);

    const now = new Date().toISOString();
    const send = {
      id: sendId,
      userId: caller.uid,
      templateId: template.id,
      templateName: template.name,
      recipientEmail: input.recipientEmail,
      customerName: input.customerName,
      merchantName: template.merchantName,
      transactionId: transaction.id,
      transactionType: transaction.type,
      transactionReference: transaction.reference,
      amountMinor: transaction.amountMinor,
      currency: transaction.currency,
      provider: "resend" as const,
      providerEmailId: null,
      status: "sending" as const,
      error: null,
      createdAt: now,
      updatedAt: now,
    };
    await createReceiptSend(send);
    try {
      const html = renderReceiptEmail({ template, transaction, customerName: input.customerName });
      const subject = template.subject.replaceAll("{{reference}}", transaction.reference).replaceAll("{{customer}}", input.customerName);
      const providerEmailId = await sendTransactionalReceipt({ fromName: template.senderName, fromEmail: template.senderEmail, to: input.recipientEmail, subject, html, idempotencyKey: sendId });
      const completed = { ...send, providerEmailId, status: "sent" as const, updatedAt: new Date().toISOString() };
      await updateReceiptSend(sendId, completed);
      await logReceiptEmailAudit({ actorId: caller.uid, action: "email.sent", targetId: sendId, transactionReference: transaction.reference });
      return NextResponse.json({ send: completed });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The receipt email could not be sent.";
      await updateReceiptSend(sendId, { status: "failed", error: message, updatedAt: new Date().toISOString() });
      await logReceiptEmailAudit({ actorId: caller.uid, action: "email.failed", targetId: sendId, error: message });
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "The receipt email could not be sent.";
    if (message === "RATE_LIMITED") return NextResponse.json({ error: "Hourly Email Flash sending limit reached. Try again later." }, { status: 429 });
    if (message === "ACTIVE_SUBSCRIPTION_REQUIRED") return NextResponse.json({ error: "An active subscription is required for Email Flash." }, { status: 403 });
    console.error("[email-flash] send failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
