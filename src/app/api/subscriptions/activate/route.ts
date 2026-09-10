import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { activateSubscription } from "@/lib/subscriptions/server";
import type { SubscriptionBillingCycle } from "@/types/subscriptions";

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const reference = String(body?.reference ?? "");
  const planId = String(body?.planId ?? "");
  const billingCycle: SubscriptionBillingCycle = body?.billingCycle === "yearly" ? "yearly" : "monthly";
  if (!reference || !planId) return NextResponse.json({ error: "Missing subscription payment details." }, { status: 400 });
  try {
    const result = await activateSubscription({ userId: caller.uid, email: caller.email, planId, billingCycle, reference });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Subscription activation failed." }, { status: 402 });
  }
}
