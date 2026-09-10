import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { listSubscriptions, saveSubscription } from "@/lib/subscriptions/store";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  if (PAYSTACK_SECRET_KEY) {
    const expected = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
    if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }
  }

  const event = JSON.parse(rawBody) as { event?: string; data?: Record<string, unknown> };
  const data = event.data ?? {};
  const customer = data.customer as { email?: string } | undefined;
  const email = customer?.email;
  const eventName = event.event ?? "";
  if (email && ["subscription.disable", "subscription.not_renew", "invoice.payment_failed", "invoice.update"].includes(eventName)) {
    const subscription = (await listSubscriptions()).find((item) => item.email === email);
    if (subscription) {
      const status = eventName === "invoice.payment_failed" ? "past_due" : eventName === "subscription.disable" ? "cancelled" : "active";
      await saveSubscription({ ...subscription, status, updatedAt: new Date().toISOString() });
    }
  }
  // Acknowledge quickly as recommended by Paystack. Detailed reconciliation can
  // be added without making Paystack retry the delivery.
  return NextResponse.json({ received: true });
}
