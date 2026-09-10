import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getPlan, getSubscriptionForUser, listPaymentsForUser } from "@/lib/subscriptions/store";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const subscription = await getSubscriptionForUser(caller.uid);
  const plan = subscription ? await getPlan(subscription.planId) : null;
  const payments = await listPaymentsForUser(caller.uid);
  return NextResponse.json({ subscription, plan, payments });
}
