import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getPlan } from "@/lib/subscriptions/store";
import type { SubscriptionBillingCycle } from "@/types/subscriptions";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const planId = String(body?.planId ?? "");
  const billingCycle = body?.billingCycle === "yearly" ? "yearly" : "monthly" as SubscriptionBillingCycle;
  const plan = await getPlan(planId);
  if (!plan || !plan.active) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  const planCode = billingCycle === "yearly" ? plan.yearlyPlanCode : plan.monthlyPlanCode;
  const reference = `sub_${caller.uid}_${Date.now()}`;

  if (!PAYSTACK_SECRET_KEY || !planCode) {
    return NextResponse.json({ demo: true, reference, authorizationUrl: `/subscription/callback?reference=${encodeURIComponent(reference)}&planId=${encodeURIComponent(plan.id)}&billingCycle=${billingCycle}` });
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: caller.email,
      amount: billingCycle === "yearly" ? plan.yearlyPriceCents : plan.monthlyPriceCents,
      plan: planCode,
      reference,
      metadata: { userId: caller.uid, planId: plan.id, billingCycle },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/subscription/callback?planId=${encodeURIComponent(plan.id)}&billingCycle=${billingCycle}`,
    }),
  });
  const data = await response.json();
  if (!response.ok || !data?.data?.authorization_url) {
    return NextResponse.json({ error: data?.message ?? "Paystack could not initialize checkout." }, { status: 502 });
  }
  return NextResponse.json({ demo: false, reference: data.data.reference ?? reference, authorizationUrl: data.data.authorization_url });
}
