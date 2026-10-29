import { NextResponse } from "next/server";

import { getDomainOrderByReference } from "@/lib/domains/store";
import { adminAuth, isAdminDbConfigured } from "@/lib/licensing/admin-db";
import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { activateSubscription } from "@/lib/subscriptions/server";
import { createSubscriptionPaymentIntent, getPaymentByReference, getPlan, getSubscriptionPaymentIntent } from "@/lib/subscriptions/store";
import { getFundingIntent } from "@/lib/wallet/store";
import { verifyPaystackTransaction } from "@/lib/wallet/paystack";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  if (!isAdminDbConfigured || !adminAuth || !process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Payment recovery is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const reference = String(body?.reference ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const action = body?.action;
  if (!/^[A-Za-z0-9._-]{6,100}$/.test(reference) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["inspect", "activate"].includes(action)) {
    return NextResponse.json({ error: "Enter a valid Paystack reference and EazyTool account email." }, { status: 400 });
  }

  try {
    const user = await adminAuth.getUserByEmail(email).catch(() => null);
    if (!user || user.email?.trim().toLowerCase() !== email) return NextResponse.json({ error: "EazyTool account not found." }, { status: 404 });

    const verified = await verifyPaystackTransaction(reference, process.env.PAYSTACK_SECRET_KEY);
    const plan = await getPlan("all-access");
    if (!plan?.active) return NextResponse.json({ error: "The subscription plan is unavailable." }, { status: 503 });
    const payment = await getPaymentByReference(reference);
    const intent = await getSubscriptionPaymentIntent(reference);
    const [walletIntent, domainOrder] = await Promise.all([getFundingIntent(reference), getDomainOrderByReference(reference)]);
    const paymentEmail = verified.customer?.email?.trim().toLowerCase();
    const metadataPurpose = String(verified.metadata?.purpose ?? "");

    if (payment?.status === "paid" && payment.userId === user.uid) {
      return NextResponse.json({ state: "already_applied", reference, email, amountMinor: payment.amountCents, currency: payment.currency });
    }
    if (payment || walletIntent || domainOrder || intent && intent.userId !== user.uid) {
      return NextResponse.json({ error: "This reference belongs to another payment or account. Review it manually." }, { status: 409 });
    }
    if (verified.status !== "success") {
      return NextResponse.json({ state: "not_paid", reference, paymentStatus: verified.status ?? "unknown" });
    }
    if (verified.reference !== reference || verified.currency !== "NGN" || verified.amount !== plan.monthlyPriceCents || paymentEmail !== email ||
      metadataPurpose && metadataPurpose !== "subscription" ||
      verified.metadata?.userId && verified.metadata.userId !== user.uid ||
      verified.metadata?.planId && verified.metadata.planId !== plan.id) {
      return NextResponse.json({ error: "Paystack payment details do not match this account and subscription price. Review the payment manually.", paymentAmountMinor: verified.amount, expectedAmountMinor: plan.monthlyPriceCents, currency: verified.currency, paymentEmail }, { status: 409 });
    }

    if (action === "inspect") {
      return NextResponse.json({ state: "ready", reference, email, amountMinor: verified.amount, currency: verified.currency, paidAt: verified.paid_at ?? null, planName: plan.name });
    }

    if (!intent) {
      const now = new Date().toISOString();
      await createSubscriptionPaymentIntent({ id: reference, userId: user.uid, email, planId: plan.id, billingCycle: "monthly", amountMinor: verified.amount, currency: "NGN", purpose: "subscription", source: "admin_recovery", reference, status: "pending", providerTransactionId: null, createdAt: now, updatedAt: now });
    } else if (intent.status !== "pending" || intent.amountMinor !== verified.amount || intent.email.trim().toLowerCase() !== email) {
      return NextResponse.json({ error: "This payment request cannot be recovered automatically. Review it manually." }, { status: 409 });
    }

    const result = await activateSubscription({ userId: user.uid, reference });
    console.info("[subscriptions] admin recovered verified payment", { adminUid: admin.uid, userId: user.uid, reference });
    return NextResponse.json({ state: "activated", reference, email, expiresAt: result.subscription?.expiresAt ?? null });
  } catch (error) {
    console.error("[subscriptions] admin payment recovery failed", { reference, reason: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "Could not verify or recover this payment. Check the Paystack reference and try again." }, { status: 502 });
  }
}
