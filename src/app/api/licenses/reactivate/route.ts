import { NextResponse } from "next/server";

import { getLicenseById, updateLicense } from "@/lib/licensing/store";
import { verifyAdminCaller } from "@/lib/licensing/verify-auth";

export async function POST(request: Request) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const licenseId = body?.licenseId as string | undefined;
  const newExpiresAt = typeof body?.expiresAt === "string" ? body.expiresAt : undefined;
  if (!licenseId) return NextResponse.json({ error: "Missing licenseId." }, { status: 400 });

  const license = await getLicenseById(licenseId);
  if (!license) return NextResponse.json({ error: "License not found." }, { status: 404 });

  const isExpired = license.expiresAt && new Date(license.expiresAt).getTime() < Date.now();

  await updateLicense({
    ...license,
    status: "active",
    expiresAt: newExpiresAt ?? (isExpired ? null : license.expiresAt),
    revokedAt: null,
    revokedReason: null,
    suspendedAt: null,
    suspendedReason: null,
  });

  return NextResponse.json({ ok: true });
}
