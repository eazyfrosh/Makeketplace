import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/licensing/jwt";
import { getLicenseById, logValidation } from "@/lib/licensing/store";
import { generateId } from "@/lib/licensing/keys";
import type { ValidationResult } from "@/types/licensing";

/**
 * Shared validation endpoint any external application calls before granting
 * access. Verifies the short-lived access token's signature and expiry, then
 * cross-checks the referenced license is still active, not expired, not
 * revoked/suspended, and actually belongs to the service presenting it.
 * Every attempt is logged regardless of outcome.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = body?.token as string | undefined;
  const serviceSlug = body?.serviceSlug as string | undefined;

  if (!token || !serviceSlug) {
    return NextResponse.json({ valid: false, reason: "denied_invalid_token" }, { status: 400 });
  }

  const verified = await verifyAccessToken(token);
  if (!verified.valid) {
    await logValidation({
      id: generateId("log"),
      licenseId: null,
      userId: null,
      serviceSlug,
      result: verified.reason === "expired" ? "denied_expired" : "denied_invalid_token",
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ valid: false, reason: "denied_invalid_token" }, { status: 401 });
  }

  const { payload } = verified;
  const license = await getLicenseById(payload.licenseId);

  const record = async (result: ValidationResult) => {
    await logValidation({
      id: generateId("log"),
      licenseId: license?.id ?? payload.licenseId,
      userId: payload.sub,
      serviceSlug,
      result,
      createdAt: new Date().toISOString(),
    });
  };

  if (!license) {
    await record("denied_not_found");
    return NextResponse.json({ valid: false, reason: "denied_not_found" }, { status: 404 });
  }
  if (license.userId !== payload.sub || license.serviceSlug !== serviceSlug) {
    await record("denied_service_mismatch");
    return NextResponse.json({ valid: false, reason: "denied_service_mismatch" }, { status: 403 });
  }
  if (license.status === "revoked") {
    await record("denied_revoked");
    return NextResponse.json({ valid: false, reason: "denied_revoked" }, { status: 403 });
  }
  if (license.status === "suspended") {
    await record("denied_suspended");
    return NextResponse.json({ valid: false, reason: "denied_suspended" }, { status: 403 });
  }
  if (license.expiresAt && new Date(license.expiresAt).getTime() < Date.now()) {
    await record("denied_expired");
    return NextResponse.json({ valid: false, reason: "denied_expired" }, { status: 403 });
  }

  await record("granted");
  return NextResponse.json({
    valid: true,
    license: {
      serviceSlug: license.serviceSlug,
      serviceName: license.serviceName,
      status: license.status,
      expiresAt: license.expiresAt,
    },
  });
}
