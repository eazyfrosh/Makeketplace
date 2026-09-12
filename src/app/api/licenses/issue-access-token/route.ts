import { NextResponse } from "next/server";

import { getServiceBySlug } from "@/lib/data/services";
import { signAccessToken } from "@/lib/licensing/jwt";
import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getPlan, getSubscriptionForUser } from "@/lib/subscriptions/store";

/**
 * Called when a customer clicks "Access" in their dashboard. Confirms they
 * hold an active, unexpired subscription for the service, then mints a short-lived
 * signed token the external service will independently validate — the
 * marketplace UI is never trusted on its own.
 */
export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const serviceSlug = body?.serviceSlug as string | undefined;
  if (!serviceSlug) {
    return NextResponse.json({ error: "Missing serviceSlug." }, { status: 400 });
  }

  const service = getServiceBySlug(serviceSlug);
  if (!service) {
    return NextResponse.json({ error: "Unknown service." }, { status: 404 });
  }

  const subscription = await getSubscriptionForUser(caller.uid);
  if (!subscription || subscription.status !== "active") return NextResponse.json({ error: "An active EazyTools subscription is required." }, { status: 403 });
  if (subscription.expiresAt && new Date(subscription.expiresAt).getTime() < Date.now()) return NextResponse.json({ error: "Your subscription has expired." }, { status: 403 });
  const plan = await getPlan(subscription.planId);
  if (!plan || (!plan.includedTools.includes("*") && !plan.includedTools.includes(serviceSlug))) return NextResponse.json({ error: "This service is not included in your subscription." }, { status: 403 });

  const token = await signAccessToken({ sub: caller.uid, serviceId: serviceSlug, licenseId: subscription.id });

  // Only the explicitly trusted Volterra deployment may receive marketplace
  // access tokens. Other external service URLs keep their legacy direct-link
  // behavior so a database value can never become a token exfiltration target.
  if (/^https?:\/\//i.test(service.accessUrl)) {
    const accessUrl = new URL(service.accessUrl);
    const configuredOrigin = process.env.VOLTERRA_APP_ORIGIN?.replace(/\/$/, "");
    const trustedOrigins = new Set([
      "https://tesla-blush-nine.vercel.app",
      ...(configuredOrigin ? [configuredOrigin] : []),
    ]);
    if (serviceSlug === "premium-templates" && trustedOrigins.has(accessUrl.origin)) {
      accessUrl.searchParams.set("token", token);
      return NextResponse.json({ redirectUrl: accessUrl.toString() });
    }
    return NextResponse.json({ redirectUrl: service.accessUrl });
  }

  const separator = service.accessUrl.includes("?") ? "&" : "?";

  return NextResponse.json({ redirectUrl: `${service.accessUrl}${separator}token=${token}` });
}
