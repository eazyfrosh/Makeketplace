import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { createSubscriptionPaymentIntent, getPlan } from "@/lib/subscriptions/store";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
export const runtime = "nodejs";

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const planId = String(body?.planId ?? "");
  const billingCycle = "monthly" as const;
  const plan = await getPlan(planId);
  if (!plan || !plan.active) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  const amountMinor = plan.monthlyPriceCents;
  const reference = `EZT-SUB-${Date.now()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

  if (!PAYSTACK_SECRET_KEY) return NextResponse.json({ error: "Subscription payments are not configured. Add PAYSTACK_SECRET_KEY in Vercel." }, { status: 503 });
  const now = new Date().toISOString();
  try {
    await createSubscriptionPaymentIntent({ id: reference, userId: caller.uid, email: caller.email.trim().toLowerCase(), planId: plan.id, billingCycle, amountMinor, currency: "NGN", purpose: "subscription", source: "direct", reference, status: "pending", providerTransactionId: null, createdAt: now, updatedAt: now });
    const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: caller.email.trim().toLowerCase(), amount: amountMinor, currency: "NGN", reference,
        callback_url: `${origin}/subscription/callback`,
        metadata: { purpose: "subscription", userId: caller.uid, planId: plan.id, billingCycle },
      }),
      signal: AbortSignal.timeout(10000),
    });
    const payload = await response.json().catch(() => null) as { status?: boolean; data?: { authorization_url?: string } } | null;
    if (!response.ok || !payload?.status || !payload.data?.authorization_url) throw new Error("Paystack checkout could not be started.");
    const checkout = new URL(payload.data.authorization_url);
    if (checkout.protocol !== "https:" || !(checkout.hostname === "paystack.com" || checkout.hostname.endsWith(".paystack.com"))) throw new Error("Invalid checkout destination.");
    return NextResponse.json({ reference, authorizationUrl: checkout.toString() });
  } catch (error) {
    console.error("[subscriptions] checkout initialization failed", { reference, reason: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "We could not start the subscription checkout. Please try again." }, { status: 502 });
  }
}
