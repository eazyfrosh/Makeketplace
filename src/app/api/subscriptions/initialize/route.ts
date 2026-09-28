import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { createSubscriptionPaymentIntent, failSubscriptionPaymentIntent, getPlan } from "@/lib/subscriptions/store";
import type { SubscriptionBillingCycle } from "@/types/subscriptions";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
export const runtime = "nodejs";

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const planId = String(body?.planId ?? "");
  const billingCycle = body?.billingCycle === "yearly" ? "yearly" : "monthly" as SubscriptionBillingCycle;
  const plan = await getPlan(planId);
  if (!plan || !plan.active) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  const planCode = billingCycle === "yearly" ? plan.yearlyPlanCode : plan.monthlyPlanCode;
  const amountMinor = billingCycle === "yearly" ? plan.yearlyPriceCents : plan.monthlyPriceCents;
  const reference = `EZT-SUB-${Date.now()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

  if (!PAYSTACK_SECRET_KEY) return NextResponse.json({ error: "Subscription payments are not configured. Add PAYSTACK_SECRET_KEY in Vercel." }, { status: 503 });
  if (!planCode) return NextResponse.json({ error: `The Paystack ${billingCycle} plan code is not configured.` }, { status: 503 });

  const now = new Date().toISOString();
  await createSubscriptionPaymentIntent({ id: reference, userId: caller.uid, email: caller.email, planId: plan.id, billingCycle, amountMinor, currency: "NGN", purpose: "subscription", reference, status: "pending", providerTransactionId: null, createdAt: now, updatedAt: now });

  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: caller.email,
        amount: amountMinor,
        currency: "NGN",
        plan: planCode,
        reference,
        metadata: { purpose: "subscription", userId: caller.uid, planId: plan.id, billingCycle, subscriptionReference: reference },
        callback_url: `${origin}/subscription/callback`,
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.data?.authorization_url) {
      await failSubscriptionPaymentIntent(reference);
      return NextResponse.json({ error: data?.message ?? "Paystack could not initialize checkout." }, { status: 502 });
    }
    return NextResponse.json({ reference, authorizationUrl: data.data.authorization_url });
  } catch (error) {
    await failSubscriptionPaymentIntent(reference);
    console.error("[subscriptions] Paystack initialization failed", error);
    return NextResponse.json({ error: "Paystack could not initialize checkout." }, { status: 502 });
  }
}
