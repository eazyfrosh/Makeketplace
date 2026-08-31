import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { generateId } from "@/lib/licensing/keys";
import { createReferral, getAffiliateByCode, getReferralForUser } from "@/lib/affiliate/store";
import type { AffiliateReferral } from "@/lib/affiliate/types";

/**
 * Called once, right after a signup, if the browser captured a `?ref=` code
 * before the account existed. Silently no-ops (never errors the signup
 * flow) on an unknown code, a self-referral, or a user who already has a
 * referral on record — attribution is first-touch and permanent per user.
 */
export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) return NextResponse.json({ ok: false });

  const affiliate = await getAffiliateByCode(code);
  if (!affiliate || affiliate.userId === caller.uid) return NextResponse.json({ ok: false });

  const existing = await getReferralForUser(caller.uid);
  if (existing) return NextResponse.json({ ok: false });

  const referral: AffiliateReferral = {
    id: generateId("ref"),
    affiliateId: affiliate.id,
    referredUserId: caller.uid,
    referredEmail: caller.email,
    createdAt: new Date().toISOString(),
  };
  await createReferral(referral);

  return NextResponse.json({ ok: true });
}
