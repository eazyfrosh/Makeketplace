import { NextResponse } from "next/server";

import { getAllLicenses, isLicensingBackendDurable } from "@/lib/licensing/store";
import { verifyAdminCaller } from "@/lib/licensing/verify-auth";

export async function GET(request: Request) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const licenses = await getAllLicenses();
  const filtered = q
    ? licenses.filter(
        (l) =>
          l.userEmail.toLowerCase().includes(q) ||
          l.serviceName.toLowerCase().includes(q) ||
          l.licenseKey.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q),
      )
    : licenses;

  return NextResponse.json({
    durable: isLicensingBackendDurable,
    licenses: filtered.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
  });
}
