import { NextResponse } from "next/server";

import { getAffiliateByCode, updateAffiliate } from "@/lib/affiliate/store";

/**
 * Public, unauthenticated — fired by the ref-capture beacon on any page
 * load that carries a `?ref=` param, including by visitors who aren't
 * signed in at all. Just a vanity click counter, not a money-moving
 * action, so no auth/rate-limiting beyond validating the code exists.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) return NextResponse.json({ ok: false }, { status: 400 });

  const affiliate = await getAffiliateByCode(code);
  if (!affiliate) return NextResponse.json({ ok: false }, { status: 404 });

  await updateAffiliate({ ...affiliate, totalClicks: affiliate.totalClicks + 1 });
  return NextResponse.json({ ok: true });
}
