import { NextResponse } from "next/server";

import { resolveServiceAccess } from "@/lib/licensing/service-access";
import { verifyCaller } from "@/lib/licensing/verify-auth";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ allowed: false, reason: "sign_in_required" }, { status: 401 });
  const slug = new URL(request.url).searchParams.get("serviceSlug");
  if (!slug) return NextResponse.json({ allowed: false, reason: "missing_tool" }, { status: 400 });
  const access = await resolveServiceAccess(caller.uid, caller.role, slug);
  return NextResponse.json(
    { allowed: access.allowed, reason: access.allowed ? null : "active_subscription_or_license_required", plan: access.planName, source: access.source },
    { status: access.allowed ? 200 : 403 },
  );
}
