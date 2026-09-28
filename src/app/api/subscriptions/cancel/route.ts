import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getSubscriptionForUser, saveSubscription } from "@/lib/subscriptions/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Paystack is not configured." }, { status: 503 });
  const subscription = await getSubscriptionForUser(caller.uid);
  if (!subscription) return NextResponse.json({ error: "No subscription was found." }, { status: 404 });
  if (subscription.status === "cancelled" || subscription.status === "non_renewing") return NextResponse.json({ subscription });
  if (!subscription.paystackSubscriptionCode || !subscription.paystackEmailToken) return NextResponse.json({ error: "This subscription cannot be cancelled automatically. Contact support." }, { status: 409 });

  const response = await fetch("https://api.paystack.co/subscription/disable", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ code: subscription.paystackSubscriptionCode, token: subscription.paystackEmailToken }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.status) return NextResponse.json({ error: payload?.message ?? "Paystack could not cancel automatic renewal." }, { status: 502 });
  const updated = { ...subscription, status: "non_renewing" as const, nextBillingAt: null, updatedAt: new Date().toISOString() };
  await saveSubscription(updated);
  return NextResponse.json({ subscription: updated });
}
