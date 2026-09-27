import { NextResponse } from "next/server";

import { verifyResendWebhook } from "@/lib/receipt-email/provider";
import { updateReceiptSendByProviderId } from "@/lib/receipt-email/store";
import type { ReceiptEmailDeliveryStatus } from "@/lib/receipt-email/types";

const STATUS: Record<string, ReceiptEmailDeliveryStatus> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delivery_delayed",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
  "email.suppressed": "suppressed",
};

export async function POST(request: Request) {
  const payload = await request.text();
  try {
    const event = await verifyResendWebhook(payload, request.headers) as { type?: string; data?: { email_id?: string; bounce?: { message?: string } } };
    const status = event.type ? STATUS[event.type] : undefined;
    const providerEmailId = event.data?.email_id;
    if (status && providerEmailId) {
      const error = ["bounced", "failed", "suppressed", "complained"].includes(status) ? event.data?.bounce?.message ?? `Email ${status}.` : null;
      await updateReceiptSendByProviderId(providerEmailId, status, error);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[email-flash] invalid webhook", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }
}
