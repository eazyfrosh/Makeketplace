import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getPlan, getSubscriptionForUser } from "@/lib/subscriptions/store";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ allowed: false, reason: "sign_in_required" }, { status: 401 });
  const slug = new URL(request.url).searchParams.get("serviceSlug");
  if (!slug) return NextResponse.json({ allowed: false, reason: "missing_tool" }, { status: 400 });
  const subscription = await getSubscriptionForUser(caller.uid);
  if (!subscription || subscription.status !== "active" || (subscription.expiresAt && new Date(subscription.expiresAt).getTime() < Date.now())) {
    return NextResponse.json({ allowed: false, reason: "active_subscription_required" }, { status: 403 });
  }
  const plan = await getPlan(subscription.planId);
  const allowed = Boolean(plan && (plan.includedTools.includes("*") || plan.includedTools.includes(slug)));
  return NextResponse.json({ allowed, reason: allowed ? null : "upgrade_required", plan: plan?.name ?? null });
}
