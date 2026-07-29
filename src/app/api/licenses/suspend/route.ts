import { NextResponse } from "next/server";

import { getLicenseById, updateLicense } from "@/lib/licensing/store";
import { verifyAdminCaller } from "@/lib/licensing/verify-auth";

export async function POST(request: Request) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const licenseId = body?.licenseId as string | undefined;
  const reason = typeof body?.reason === "string" ? body.reason : null;
  if (!licenseId) return NextResponse.json({ error: "Missing licenseId." }, { status: 400 });

  const license = await getLicenseById(licenseId);
  if (!license) return NextResponse.json({ error: "License not found." }, { status: 404 });
  if (license.status === "revoked") {
    return NextResponse.json({ error: "A revoked license cannot be suspended." }, { status: 409 });
  }

  await updateLicense({
    ...license,
    status: "suspended",
    suspendedAt: new Date().toISOString(),
    suspendedReason: reason,
  });

  return NextResponse.json({ ok: true });
}
