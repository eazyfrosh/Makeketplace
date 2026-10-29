import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getPlan, getSubscriptionForUser, listPaymentsForUser } from "@/lib/subscriptions/store";
import { reconcilePendingSubscriptionForUser } from "@/lib/subscriptions/server";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await reconcilePendingSubscriptionForUser(caller.uid).catch((error: unknown) => {
    console.error("[subscriptions] account reconciliation unavailable", { reason: error instanceof Error ? error.name : "unknown" });
  });
  const subscription = await getSubscriptionForUser(caller.uid);
  const plan = subscription ? await getPlan(subscription.planId) : null;
  const payments = await listPaymentsForUser(caller.uid);
  return NextResponse.json({ subscription, plan, payments });
}
