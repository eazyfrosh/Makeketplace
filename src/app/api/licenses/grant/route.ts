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
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { sendEmail } from "@/lib/email/send";
import { licenseIssuedEmail } from "@/lib/email/templates";
import type { CartItem, Order } from "@/types";
import type { License } from "@/types/licensing";

interface GrantRequestBody {
  email: string;
  serviceSlugs: string[];
  billing?: "one-time" | "monthly";
}

async function grantOne(
  targetUid: string,
  email: string,
  serviceSlug: string,
  billing: "one-time" | "monthly",
): Promise<License> {
  const service = getServiceBySlug(serviceSlug);
  if (!service) throw new Error(`Unknown service: ${serviceSlug}`);

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
  return license;
}

/**
 * Admin-only: issues complimentary (no-payment) licenses for one or more
 * services to an existing user, identified by email. Mirrors
 * /api/checkout/confirm's order/license construction exactly per service,
 * just with totalCents forced to 0 and provider: "admin_grant" instead of a
 * real payment reference.
 */
async function handlePost(request: Request) {
  // Split out from verifyAdminCaller so a role mismatch reports exactly what
  // the server resolved instead of one opaque "access required" message —
  // this endpoint's admin check is intentionally independent of the client
  // SDK's view (see /admin/licenses page), so the two can legitimately
  // disagree if e.g. the wrong Firestore doc got promoted to admin.
  const caller = await verifyCaller(request);
  if (!caller) {
    return NextResponse.json({ error: "Sign in required — no valid session was found on this request." }, { status: 401 });
  }
  if (caller.role !== "admin") {
    return NextResponse.json(
      {
        error: `Signed in as ${caller.email} (uid: ${caller.uid}), but the server resolved this account's role as "${caller.role}", not "admin". Check that the Firestore users/${caller.uid} document has role set to the exact string "admin", and that FIREBASE_ADMIN_PROJECT_ID points at the same Firebase project as NEXT_PUBLIC_FIREBASE_PROJECT_ID.`,
      },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as GrantRequestBody | null;
  const email = body?.email?.trim().toLowerCase();
  const serviceSlugs = body?.serviceSlugs?.filter(Boolean) ?? [];
  if (!body || !email || serviceSlugs.length === 0) {
    return NextResponse.json({ error: "email and at least one serviceSlug are required." }, { status: 400 });
  }

  const unknown = serviceSlugs.filter((slug) => !getServiceBySlug(slug));
  if (unknown.length > 0) {
    return NextResponse.json({ error: `Unknown service(s): ${unknown.join(", ")}` }, { status: 400 });
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
  } catch (err) {
    console.error("[licenses/grant] getUserByEmail failed:", err);
    return NextResponse.json(
      { error: `No account found for ${email}. Ask them to sign up first, then grant access again.` },
      { status: 404 },
    );
  }

  const billing = body.billing === "monthly" ? "monthly" : "one-time";
  const licenses: License[] = [];
  for (const slug of serviceSlugs) {
    licenses.push(await grantOne(targetUid, email, slug, billing));
  }

  // The licenses above are already granted at this point — a broken email
  // provider (bad API key, unverified sender domain) must never fail the
  // whole request and leave the admin thinking the grant itself failed.
  try {
    const email_ = licenseIssuedEmail({
      name: email.split("@")[0],
      orderId: `admin-grant-${Date.now()}`,
      totalCents: 0,
      items: licenses.map((l) => ({ serviceName: l.serviceName, licenseKey: l.licenseKey })),
    });
    await sendEmail({ to: email, subject: email_.subject, html: email_.html });
  } catch (err) {
    console.error("[licenses/grant] license(s) granted but notification email failed:", err);
  }

  return NextResponse.json({
    licenses: licenses.map((l) => ({
      serviceSlug: l.serviceSlug,
      serviceName: l.serviceName,
      licenseKey: l.licenseKey,
      status: l.status,
      expiresAt: l.expiresAt,
    })),
  });
}

export async function POST(request: Request) {
  try {
    return await handlePost(request);
  } catch (err) {
    // Guarantees a JSON body even on an unexpected crash (e.g. a malformed
    // FIREBASE_ADMIN_PRIVATE_KEY breaking a Firestore/Auth Admin SDK call) —
    // without this, Next.js/Vercel returns an HTML error page instead, which
    // shows up client-side as "Unexpected token '<' ... is not valid JSON"
    // with no indication of what actually failed.
    console.error("[licenses/grant] unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected server error." },
      { status: 500 },
    );
  }
}
