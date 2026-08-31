import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getAffiliateByUserId, getCommissionsForAffiliate, getReferralsForAffiliate } from "@/lib/affiliate/store";

export async function GET(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const affiliate = await getAffiliateByUserId(caller.uid);
  if (!affiliate) return NextResponse.json({ affiliate: null });

  const [referrals, commissions] = await Promise.all([
    getReferralsForAffiliate(affiliate.id),
    getCommissionsForAffiliate(affiliate.id),
  ]);

  const pendingCents = commissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + c.commissionCents, 0);
  const paidCents = commissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + c.commissionCents, 0);

  return NextResponse.json({
    affiliate,
    referrals: referrals.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    commissions: commissions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    pendingCents,
    paidCents,
  });
}
