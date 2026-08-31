import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { generateId } from "@/lib/licensing/keys";
import { DEFAULT_COMMISSION_RATE_PERCENT, generateAffiliateCode } from "@/lib/affiliate/code";
import { createAffiliate, getAffiliateByCode, getAffiliateByUserId } from "@/lib/affiliate/store";
import type { Affiliate } from "@/lib/affiliate/types";

/** Self-serve, instant approval — any signed-in user can join and gets a live referral link immediately. */
export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const existing = await getAffiliateByUserId(caller.uid);
  if (existing) return NextResponse.json({ affiliate: existing });

  let code = generateAffiliateCode();
  for (let attempt = 0; attempt < 5 && (await getAffiliateByCode(code)); attempt++) {
    code = generateAffiliateCode();
  }

  const affiliate: Affiliate = {
    id: generateId("aff"),
    userId: caller.uid,
    email: caller.email,
    code,
    commissionRatePercent: DEFAULT_COMMISSION_RATE_PERCENT,
    status: "active",
    totalClicks: 0,
    createdAt: new Date().toISOString(),
  };
  await createAffiliate(affiliate);

  return NextResponse.json({ affiliate });
}
