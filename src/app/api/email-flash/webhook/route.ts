import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { emailDomainProvider } from "@/lib/email-domains/provider";
import { claimProviderEvent, recordEmailDomainDelivery, releaseProviderEvent, suppressRecipient } from "@/lib/email-domains/store";
import { updateReceiptSendByProviderId } from "@/lib/receipt-email/store";
import type { ReceiptEmailDeliveryStatus } from "@/lib/receipt-email/types";

const STATUS: Record<string, ReceiptEmailDeliveryStatus> = {
  "email.queued": "queued", "email.sent": "sent", "email.delivered": "delivered",
  "email.delivery_delayed": "delayed", "email.bounced": "bounced", "email.complained": "complained",
  "email.failed": "failed", "email.suppressed": "suppressed",
};

type ProviderEvent = { type?: string; data?: { email_id?: string; to?: string[]; bounce?: { message?: string }; failed?: { reason?: string } } };

export async function POST(request: Request) {
  const payload = await request.text();
  let event: ProviderEvent;
  try { event = await emailDomainProvider.verifyWebhook(payload, request.headers) as ProviderEvent; }
  catch (error) { console.error("[email-designer] invalid webhook", error); return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 }); }
  const eventId = request.headers.get("svix-id") || createHash("sha256").update(payload).digest("hex");
  const claimed = await claimProviderEvent(eventId, event.type ?? "unknown");
  if (!claimed) return NextResponse.json({ received: true, duplicate: true });
  try {
    const status = event.type ? STATUS[event.type] : undefined; const providerEmailId = event.data?.email_id;
    if (status && providerEmailId) {
      const failure = ["bounced", "failed", "suppressed", "complained"].includes(status) ? event.data?.bounce?.message ?? event.data?.failed?.reason ?? `Email ${status}.` : null;
      const send = await updateReceiptSendByProviderId(providerEmailId, status, failure);
      if (send?.emailDomainId && ["delivered", "bounced", "complained", "failed"].includes(status)) await recordEmailDomainDelivery(send.emailDomainId, status as "delivered" | "bounced" | "complained" | "failed");
      if (send && ["bounced", "complained", "suppressed"].includes(status)) await suppressRecipient(send.userId, send.recipientEmail, status);
    }
    return NextResponse.json({ received: true });
  } catch (error) { await releaseProviderEvent(eventId); console.error("[email-designer] webhook processing failed", error); return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 }); }
}
