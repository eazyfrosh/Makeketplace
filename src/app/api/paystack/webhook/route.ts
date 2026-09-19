import { NextResponse } from "next/server";
import { getDomainOrderByReference } from "@/lib/domains/store";
import { registerPaidDomain } from "@/lib/domains/service";
import { sanitizeRegistrant } from "@/types/domains";
import { creditVerifiedDeposit, failFundingIntent, getFundingIntent } from "@/lib/wallet/store";
import { verifyPaystackSignature, verifyPaystackTransaction } from "@/lib/wallet/paystack";
import { listSubscriptions, saveSubscription } from "@/lib/subscriptions/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Paystack webhook is not configured." }, { status: 503 });
  const rawBody = await request.text();
  if (!verifyPaystackSignature(rawBody, request.headers.get("x-paystack-signature") ?? "", secret)) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  let payload: { event?: string; data?: { id?: number; reference?: string; status?: string; metadata?: Record<string, unknown>; customer?: { email?: string } } };
  try { payload = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const subscriptionEvents = new Set(["subscription.disable", "subscription.not_renew", "invoice.payment_failed", "invoice.update"]);
  if (payload.event && subscriptionEvents.has(payload.event) && payload.data?.customer?.email) {
    const subscription = (await listSubscriptions()).find((item) => item.email === payload.data?.customer?.email);
    if (subscription) {
      const status = payload.event === "invoice.payment_failed" ? "past_due" : payload.event === "subscription.disable" ? "cancelled" : "active";
      await saveSubscription({ ...subscription, status, updatedAt: new Date().toISOString() });
    }
    return NextResponse.json({ received: true });
  }
  const reference = payload.data?.reference;
  if (!reference) return NextResponse.json({ received: true });
  try {
    if (payload.data?.metadata?.purpose === "wallet_funding") {
      if (payload.event !== "charge.success" || payload.data.status !== "success") { if (payload.event === "charge.failed") await failFundingIntent(reference); return NextResponse.json({ received: true }); }
      const [verified, intent] = await Promise.all([verifyPaystackTransaction(reference, secret), getFundingIntent(reference)]);
      if (!intent) return NextResponse.json({ error: "Unknown funding reference." }, { status: 404 });
      if (verified.reference !== reference || verified.status !== "success" || verified.amount !== intent.amountMinor || verified.currency !== intent.currency || verified.metadata?.purpose !== "wallet_funding" || verified.metadata?.userId !== intent.userId) return NextResponse.json({ error: "Verified payment details do not match the funding request." }, { status: 422 });
      await creditVerifiedDeposit({ reference, providerReference: verified.reference, providerTransactionId: String(verified.id ?? reference) });
      return NextResponse.json({ received: true });
    }
    if (payload.event !== "charge.success" || payload.data?.status !== "success") return NextResponse.json({ received: true });
    const verified = await verifyPaystackTransaction(reference, secret);
    if (verified.reference !== reference || verified.status !== "success") return NextResponse.json({ error: "Payment verification failed." }, { status: 422 });
    const order = await getDomainOrderByReference(reference);
    if (!order || order.paymentStatus === "paid") return NextResponse.json({ received: true });
    if (verified.amount !== order.amountCents || verified.currency !== order.currency || verified.metadata?.userId !== order.userId) return NextResponse.json({ error: "Verified payment details do not match the domain order." }, { status: 422 });
    await registerPaidDomain(reference, order.userId, sanitizeRegistrant({ email: "", name: "Paystack customer" }));
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[paystack webhook] processing failed", { reference, error });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
