import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { createSubscriptionPaymentIntent, getPlan } from "@/lib/subscriptions/store";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYMENT_PAGE_URL = process.env.PAYSTACK_SUBSCRIPTION_PAYMENT_PAGE_URL ?? "https://paystack.shop/pay/eazytoolsub";
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
  let paymentPage: URL;
  try {
    paymentPage = new URL(PAYMENT_PAGE_URL);
    if (paymentPage.protocol !== "https:" || !["paystack.shop", "paystack.com"].includes(paymentPage.hostname)) throw new Error();
  } catch {
    return NextResponse.json({ error: "The Paystack subscription payment page is not configured correctly." }, { status: 503 });
  }

  const now = new Date().toISOString();
  await createSubscriptionPaymentIntent({ id: reference, userId: caller.uid, email: caller.email.trim().toLowerCase(), planId: plan.id, billingCycle, amountMinor, currency: "NGN", purpose: "subscription", reference, status: "pending", providerTransactionId: null, createdAt: now, updatedAt: now });

  paymentPage.searchParams.set("email", caller.email.trim().toLowerCase());
  paymentPage.searchParams.set("read-only", "email");
  return NextResponse.json({ reference, authorizationUrl: paymentPage.toString() });
}
