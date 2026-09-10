import { NextResponse } from "next/server";

import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { listPlans, listSubscriptions, savePlan } from "@/lib/subscriptions/store";

export async function GET(request: Request) {
  const caller = await verifyAdminCaller(request);
  if (!caller) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  return NextResponse.json({ plans: await listPlans(), subscriptions: await listSubscriptions() });
}

export async function PATCH(request: Request) {
  const caller = await verifyAdminCaller(request);
  if (!caller) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body?.id || typeof body.monthlyPriceCents !== "number" || typeof body.yearlyPriceCents !== "number" || typeof body.monthlyUsageLimit !== "number") {
    return NextResponse.json({ error: "Invalid plan configuration." }, { status: 400 });
  }
  const plans = await listPlans();
  const current = plans.find((plan) => plan.id === body.id);
  if (!current) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  const updated = { ...current, monthlyPriceCents: body.monthlyPriceCents, yearlyPriceCents: body.yearlyPriceCents, monthlyUsageLimit: body.monthlyUsageLimit, updatedAt: new Date().toISOString() };
  await savePlan(updated);
  return NextResponse.json({ plan: updated });
}
