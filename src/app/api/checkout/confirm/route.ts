import { NextResponse } from "next/server";

import { getServiceBySlug } from "@/lib/data/services";
import { findCoupon } from "@/lib/data/coupons";
import { isStripeConfigured, stripe } from "@/lib/stripe/server";
import { generateId, generateLicenseKey } from "@/lib/licensing/keys";
import {
  createLicense,
  createOrderRecord,
  getLicenseForUserAndService,
  getOrdersForUser,
  updateLicense,
} from "@/lib/licensing/store";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { sendEmail } from "@/lib/email/send";
import { licenseIssuedEmail } from "@/lib/email/templates";
import { createCommission, getAffiliateById, getReferralForUser } from "@/lib/affiliate/store";
import type { AffiliateCommission } from "@/lib/affiliate/types";
import type { CartItem, Order, PaymentProvider } from "@/types";
import type { License } from "@/types/licensing";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

interface ConfirmRequestBody {
  provider: PaymentProvider;
  paymentReference: string;
  items: { serviceSlug: string; billing: "one-time" | "monthly" }[];
  couponCode: string | null;
}

async function verifyStripePayment(reference: string, expectedCents: number): Promise<boolean> {
  if (!isStripeConfigured || !stripe) return true; // demo mode
  const intent = await stripe.paymentIntents.retrieve(reference);
  return intent.status === "succeeded" && intent.amount === Math.round(expectedCents);
}

async function verifyPaystackPayment(reference: string, expectedCents: number): Promise<boolean> {
  if (!PAYSTACK_SECRET_KEY) return true; // demo mode
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data?.data?.status === "success" && Math.round(data.data.amount) === Math.round(expectedCents);
}

async function verifyFlutterwavePayment(reference: string, expectedCents: number): Promise<boolean> {
  if (!FLUTTERWAVE_SECRET_KEY) return true; // demo mode
  const res = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(reference)}/verify`, {
    headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return (
    data?.data?.status === "successful" &&
    Math.round(Number(data.data.amount) * 100) === Math.round(expectedCents)
  );
}

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) {
    return NextResponse.json({ error: "Sign in required to complete checkout." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ConfirmRequestBody | null;
  if (!body || !Array.isArray(body.items) || body.items.length === 0 || !body.paymentReference) {
    return NextResponse.json({ error: "Invalid checkout payload." }, { status: 400 });
  }

  // Recompute everything from canonical, server-owned data — never trust
  // client-sent prices, discounts, or totals.
  const resolvedItems: CartItem[] = [];
  for (const raw of body.items) {
    const service = getServiceBySlug(raw.serviceSlug);
    if (!service) {
      return NextResponse.json({ error: `Unknown service: ${raw.serviceSlug}` }, { status: 400 });
    }
    resolvedItems.push({
      serviceSlug: service.slug,
      serviceName: service.name,
      packageId: service.slug,
      packageName: service.name,
      priceCents: service.startingPriceCents,
      billing: raw.billing === "monthly" ? "monthly" : "one-time",
    });
  }

  const subtotalCents = resolvedItems.reduce((sum, item) => sum + item.priceCents, 0);
  const coupon = body.couponCode ? findCoupon(body.couponCode) : null;
  const discountCents = coupon ? Math.round((subtotalCents * coupon.percentOff) / 100) : 0;
  const totalCents = Math.max(0, subtotalCents - discountCents);

  // Idempotency: never issue a second order/license set for a payment
  // reference we've already processed (double-submit, back-button replay).
  const existingOrders = await getOrdersForUser(caller.uid);
  if (existingOrders.some((o) => o.paymentReference === body.paymentReference)) {
    return NextResponse.json({ error: "This payment has already been processed." }, { status: 409 });
  }

  let verified: boolean;
  try {
    if (body.provider === "stripe") {
      verified = await verifyStripePayment(body.paymentReference, totalCents);
    } else if (body.provider === "paystack") {
      verified = await verifyPaystackPayment(body.paymentReference, totalCents);
    } else if (body.provider === "flutterwave") {
      verified = await verifyFlutterwavePayment(body.paymentReference, totalCents);
    } else {
      return NextResponse.json({ error: "Unknown payment provider." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Could not verify payment with the provider." }, { status: 502 });
  }

  if (!verified) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 402 });
  }

  const order: Order = {
    id: generateId("ord"),
    userId: caller.uid,
    email: caller.email,
    items: resolvedItems,
    subtotalCents,
    discountCents,
    totalCents,
    couponCode: coupon?.code ?? null,
    provider: body.provider,
    paymentReference: body.paymentReference,
    status: "paid",
    licenseIds: [],
    createdAt: new Date().toISOString(),
  };

  // Re-purchasing a service you already hold a non-revoked license for
  // renews that license instead of minting a duplicate one; a different
  // service always gets its own new license.
  const licenses: License[] = [];
  for (const item of resolvedItems) {
    const issuedAt = new Date();
    const expiresAt =
      item.billing === "monthly"
        ? new Date(issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const existing = await getLicenseForUserAndService(caller.uid, item.serviceSlug);
    if (existing && existing.status !== "revoked") {
      const renewed: License = {
        ...existing,
        orderId: order.id,
        status: "active",
        expiresAt,
        renewedAt: issuedAt.toISOString(),
        suspendedAt: null,
        suspendedReason: null,
      };
      await updateLicense(renewed);
      licenses.push(renewed);
      continue;
    }

    const license: License = {
      id: generateId("lic"),
      licenseKey: generateLicenseKey(),
      userId: caller.uid,
      userEmail: caller.email,
      serviceSlug: item.serviceSlug,
      serviceName: item.serviceName,
      orderId: order.id,
      status: "active",
      billing: item.billing,
      issuedAt: issuedAt.toISOString(),
      expiresAt,
      renewedAt: null,
      revokedAt: null,
      revokedReason: null,
      suspendedAt: null,
      suspendedReason: null,
    };
    await createLicense(license);
    licenses.push(license);
  }
  order.licenseIds = licenses.map((l) => l.id);

  await createOrderRecord(order);

  // Credit the referring affiliate, if any — never fails checkout itself,
  // same reasoning as the email below: the order is already real by now.
  try {
    const referral = await getReferralForUser(caller.uid);
    if (referral) {
      const affiliate = await getAffiliateById(referral.affiliateId);
      if (affiliate?.status === "active") {
        const commission: AffiliateCommission = {
          id: generateId("comm"),
          affiliateId: affiliate.id,
          orderId: order.id,
          referredUserId: caller.uid,
          orderTotalCents: totalCents,
          commissionCents: Math.round((totalCents * affiliate.commissionRatePercent) / 100),
          status: "pending",
          payoutRequestId: null,
          createdAt: new Date().toISOString(),
        };
        await createCommission(commission);
      }
    }
  } catch (err) {
    console.error("[checkout/confirm] order issued but affiliate commission failed:", err);
  }

  // The order/licenses above are already paid for and issued at this point —
  // a broken email provider (bad API key, unverified sender domain) must
  // never fail the whole checkout and leave the customer thinking they were
  // charged but got nothing.
  try {
    const email = licenseIssuedEmail({
      name: caller.email.split("@")[0],
      orderId: order.id,
      totalCents,
      items: licenses.map((l) => ({ serviceName: l.serviceName, licenseKey: l.licenseKey })),
    });
    await sendEmail({ to: caller.email, subject: email.subject, html: email.html });
  } catch (err) {
    console.error("[checkout/confirm] order/license(s) issued but confirmation email failed:", err);
  }

  return NextResponse.json({
    order: { id: order.id, totalCents: order.totalCents, createdAt: order.createdAt },
    licenses: licenses.map((l) => ({
      serviceSlug: l.serviceSlug,
      serviceName: l.serviceName,
      licenseKey: l.licenseKey,
      status: l.status,
      expiresAt: l.expiresAt,
    })),
  });
}
