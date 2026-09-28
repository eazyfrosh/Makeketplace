import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { getDomainOrderByReference } from "@/lib/domains/store";
import { registerPaidDomain } from "@/lib/domains/service";
import {
  getSubscriptionPaymentIntent,
  failSubscriptionPaymentIntent,
  hasPaystackProviderEvent,
  markSubscriptionPaymentRefunded,
  recordPaystackProviderEvent,
} from "@/lib/subscriptions/store";
import { activateSubscription, processSubscriptionRenewal, updateSubscriptionFromProvider } from "@/lib/subscriptions/server";
import { creditVerifiedDeposit, failFundingIntent, getFundingIntent, reverseVerifiedDeposit } from "@/lib/wallet/store";
import { verifyPaystackSignature, verifyPaystackTransaction } from "@/lib/wallet/paystack";
import { sanitizeRegistrant } from "@/types/domains";

export const runtime = "nodejs";

type PaystackEvent = {
  event?: string;
  data?: {
    id?: number | string;
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
    paid?: boolean;
    metadata?: Record<string, unknown>;
    customer?: { email?: string; customer_code?: string };
    subscription_code?: string;
    email_token?: string;
    next_payment_date?: string;
    transaction?: { id?: number | string; reference?: string };
    subscription?: { subscription_code?: string; email_token?: string; next_payment_date?: string; customer?: { email?: string; customer_code?: string } };
  };
};

function providerIdentity(data: NonNullable<PaystackEvent["data"]>) {
  return {
    email: data.customer?.email ?? data.subscription?.customer?.email,
    customerCode: data.customer?.customer_code ?? data.subscription?.customer?.customer_code,
    subscriptionCode: data.subscription_code ?? data.subscription?.subscription_code,
    emailToken: data.email_token ?? data.subscription?.email_token,
    nextBillingAt: data.next_payment_date ?? data.subscription?.next_payment_date,
  };
}

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Paystack webhook is not configured." }, { status: 503 });
  const rawBody = await request.text();
  if (!verifyPaystackSignature(rawBody, request.headers.get("x-paystack-signature") ?? "", secret)) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });

  let payload: PaystackEvent;
  try { payload = JSON.parse(rawBody) as PaystackEvent; } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const eventName = payload.event ?? "unknown";
  const data = payload.data ?? {};
  const reference = data.reference ?? data.transaction?.reference ?? null;
  const eventId = crypto.createHash("sha256").update(rawBody).digest("hex");
  if (await hasPaystackProviderEvent(eventId)) return NextResponse.json({ received: true, duplicate: true });

  try {
    if (eventName === "charge.success" && reference) {
      const verified = await verifyPaystackTransaction(reference, secret);
      const purpose = String(verified.metadata?.purpose ?? data.metadata?.purpose ?? "");
      if (purpose === "wallet_topup" || purpose === "wallet_funding") {
        const intent = await getFundingIntent(reference);
        if (!intent) throw new Error("Unknown wallet top-up reference.");
        if (verified.status !== "success" || verified.reference !== reference || verified.amount !== intent.amountMinor || verified.currency !== intent.currency || !["wallet_topup", "wallet_funding"].includes(String(verified.metadata?.purpose)) || verified.metadata?.userId !== intent.userId) throw new Error("Verified wallet payment details do not match the top-up request.");
        await creditVerifiedDeposit({ reference, providerReference: verified.reference, providerTransactionId: String(verified.id ?? reference) });
      } else {
        const subscriptionIntent = await getSubscriptionPaymentIntent(reference);
        if (purpose === "subscription" || subscriptionIntent) {
          if (!subscriptionIntent) throw new Error("Unknown subscription payment reference.");
          await activateSubscription({ userId: subscriptionIntent.userId, reference });
        } else {
          const order = await getDomainOrderByReference(reference);
          if (order) {
            if (order.paymentStatus !== "paid") {
              if (verified.status !== "success" || verified.amount !== order.amountCents || verified.currency !== order.currency || verified.metadata?.userId !== order.userId) throw new Error("Verified payment details do not match the domain order.");
              await registerPaidDomain(reference, order.userId, sanitizeRegistrant({ email: "", name: "Paystack customer" }));
            }
          } else {
            await processSubscriptionRenewal(reference);
          }
        }
      }
    } else if (eventName === "charge.failed" && reference) {
      await Promise.all([failFundingIntent(reference), failSubscriptionPaymentIntent(reference)]);
    } else if (["subscription.create", "subscription.disable", "subscription.not_renew", "invoice.payment_failed", "invoice.update"].includes(eventName)) {
      const identity = providerIdentity(data);
      const status = ["subscription.disable", "subscription.not_renew"].includes(eventName) ? "non_renewing" : eventName === "invoice.payment_failed" ? "past_due" : "active";
      if (eventName !== "invoice.update" || data.paid === true || data.status === "success") await updateSubscriptionFromProvider({ ...identity, status, nextBillingAt: identity.nextBillingAt ?? null, emailToken: identity.emailToken ?? null });
    } else if (eventName === "refund.processed" && (data.transaction?.reference || reference)) {
      const originalReference = data.transaction?.reference ?? reference as string;
      await markSubscriptionPaymentRefunded(originalReference);
      await reverseVerifiedDeposit({ reference: originalReference, refundReference: String(data.id ?? `refund_${originalReference}`) });
    }

    await recordPaystackProviderEvent(eventId, eventName, reference);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[paystack webhook] processing failed", { eventName, reference, eventId, error });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
