import { NextResponse } from "next/server";

import { getServiceBySlug } from "@/lib/data/services";
import { signAccessToken } from "@/lib/licensing/jwt";
import { getLicenseForUserAndService } from "@/lib/licensing/store";
import { verifyCaller } from "@/lib/licensing/verify-auth";

/**
 * Called when a customer clicks "Access" in their dashboard. Confirms they
 * hold an active, unexpired license for the service, then mints a short-lived
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

  const license = await getLicenseForUserAndService(caller.uid, serviceSlug);
  if (!license) {
    return NextResponse.json({ error: "You don't own a license for this service." }, { status: 403 });
  }
  if (license.status !== "active") {
    return NextResponse.json({ error: `License is ${license.status}.` }, { status: 403 });
  }
  if (license.expiresAt && new Date(license.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "License has expired." }, { status: 403 });
  }

  // An absolute URL points at a separately-hosted service we don't control —
  // it can't validate our JWT, so appending one would just leak an unusable
  // token. Relative URLs (our own ported platforms) keep the token-append
  // behavior for any future server-side validation that wants it, though the
  // current platform route guards re-check license status directly instead.
  if (/^https?:\/\//i.test(service.accessUrl)) {
    return NextResponse.json({ redirectUrl: service.accessUrl });
  }

  const token = await signAccessToken({ sub: caller.uid, serviceId: serviceSlug, licenseId: license.id });
  const separator = service.accessUrl.includes("?") ? "&" : "?";

  return NextResponse.json({ redirectUrl: `${service.accessUrl}${separator}token=${token}` });
}
