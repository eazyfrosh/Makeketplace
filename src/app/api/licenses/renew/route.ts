import { NextResponse } from "next/server";

import { getLicenseById, updateLicense } from "@/lib/licensing/store";
import { verifyAdminCaller } from "@/lib/licensing/verify-auth";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const licenseId = body?.licenseId as string | undefined;
  const extendDays = Number(body?.extendDays ?? 30);
  if (!licenseId || !Number.isFinite(extendDays) || extendDays <= 0) {
    return NextResponse.json({ error: "Missing licenseId or invalid extendDays." }, { status: 400 });
  }

  const license = await getLicenseById(licenseId);
  if (!license) return NextResponse.json({ error: "License not found." }, { status: 404 });
  if (license.status === "revoked") {
    return NextResponse.json({ error: "A revoked license cannot be renewed." }, { status: 409 });
  }

  const currentExpiry = license.expiresAt ? new Date(license.expiresAt).getTime() : Date.now();
  const base = Math.max(currentExpiry, Date.now());
  const expiresAt = new Date(base + extendDays * DAY_MS).toISOString();

  await updateLicense({
    ...license,
    status: "active",
    expiresAt,
    renewedAt: new Date().toISOString(),
    suspendedAt: null,
    suspendedReason: null,
  });

  return NextResponse.json({ ok: true, expiresAt });
}
