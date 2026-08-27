import { NextResponse } from "next/server";

import { getServiceBySlug } from "@/lib/data/services";
import { generateId, generateLicenseKey } from "@/lib/licensing/keys";
import { adminAuth, isAdminDbConfigured } from "@/lib/licensing/admin-db";
import {
  createLicense,
  createOrderRecord,
  getLicenseForUserAndService,
  updateLicense,
} from "@/lib/licensing/store";
import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { sendEmail } from "@/lib/email/send";
import { licenseIssuedEmail } from "@/lib/email/templates";
import type { CartItem, Order } from "@/types";
import type { License } from "@/types/licensing";

interface GrantRequestBody {
  email: string;
  serviceSlug: string;
  billing?: "one-time" | "monthly";
}

/**
 * Admin-only: issues a complimentary (no-payment) license for an existing
 * user, identified by email. Mirrors /api/checkout/confirm's order/license
 * construction exactly, just with totalCents forced to 0 and
 * provider: "admin_grant" instead of a real payment reference.
 */
export async function POST(request: Request) {
  const admin = await verifyAdminCaller(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as GrantRequestBody | null;
  const email = body?.email?.trim().toLowerCase();
  if (!body || !email || !body.serviceSlug) {
    return NextResponse.json({ error: "email and serviceSlug are required." }, { status: 400 });
  }

  const service = getServiceBySlug(body.serviceSlug);
  if (!service) {
    return NextResponse.json({ error: `Unknown service: ${body.serviceSlug}` }, { status: 400 });
  }

  if (!isAdminDbConfigured || !adminAuth) {
    return NextResponse.json(
      {
        error:
          "Granting access by email needs Firebase Admin credentials configured (this deployment is in demo mode, which has no server-side directory of registered emails). Set FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY, or have the user sign in and grant it to themselves via checkout with a 100%-off coupon instead.",
      },
      { status: 400 },
    );
  }

  let targetUid: string;
  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    targetUid = userRecord.uid;
  } catch {
    return NextResponse.json(
      { error: `No account found for ${email}. Ask them to sign up first, then grant access again.` },
      { status: 404 },
    );
  }

  const billing = body.billing === "monthly" ? "monthly" : "one-time";
  const item: CartItem = {
    serviceSlug: service.slug,
    serviceName: service.name,
    packageId: service.slug,
    packageName: service.name,
    priceCents: service.startingPriceCents,
    billing,
  };

  const order: Order = {
    id: generateId("ord"),
    userId: targetUid,
    email,
    items: [item],
    subtotalCents: item.priceCents,
    discountCents: item.priceCents,
    totalCents: 0,
    couponCode: null,
    provider: "admin_grant",
    paymentReference: generateId("admin-grant"),
    status: "paid",
    licenseIds: [],
    createdAt: new Date().toISOString(),
  };

  const issuedAt = new Date();
  const expiresAt =
    billing === "monthly" ? new Date(issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

  const existing = await getLicenseForUserAndService(targetUid, service.slug);
  let license: License;
  if (existing && existing.status !== "revoked") {
    license = {
      ...existing,
      orderId: order.id,
      status: "active",
      expiresAt,
      renewedAt: issuedAt.toISOString(),
      suspendedAt: null,
      suspendedReason: null,
    };
    await updateLicense(license);
  } else {
    license = {
      id: generateId("lic"),
      licenseKey: generateLicenseKey(),
      userId: targetUid,
      userEmail: email,
      serviceSlug: service.slug,
      serviceName: service.name,
      orderId: order.id,
      status: "active",
      billing,
      issuedAt: issuedAt.toISOString(),
      expiresAt,
      renewedAt: null,
      revokedAt: null,
      revokedReason: null,
      suspendedAt: null,
      suspendedReason: null,
    };
    await createLicense(license);
  }

  order.licenseIds = [license.id];
  await createOrderRecord(order);

  const email_ = licenseIssuedEmail({
    name: email.split("@")[0],
    orderId: order.id,
    totalCents: 0,
    items: [{ serviceName: license.serviceName, licenseKey: license.licenseKey }],
  });
  await sendEmail({ to: email, subject: email_.subject, html: email_.html });

  return NextResponse.json({
    license: {
      serviceSlug: license.serviceSlug,
      serviceName: license.serviceName,
      licenseKey: license.licenseKey,
      status: license.status,
      expiresAt: license.expiresAt,
    },
  });
}
