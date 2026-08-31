import { NextResponse } from "next/server";

import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { getAllAffiliates, getCommissionsForAffiliate, getReferralsForAffiliate } from "@/lib/affiliate/store";

export async function GET(request: Request) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const affiliates = await getAllAffiliates();
  const rows = await Promise.all(
    affiliates.map(async (affiliate) => {
      const [referrals, commissions] = await Promise.all([
        getReferralsForAffiliate(affiliate.id),
        getCommissionsForAffiliate(affiliate.id),
      ]);
      return {
        affiliate,
        referralCount: referrals.length,
        pendingCents: commissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + c.commissionCents, 0),
        paidCents: commissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + c.commissionCents, 0),
      };
    }),
  );

  return NextResponse.json({ rows: rows.sort((a, b) => b.affiliate.createdAt.localeCompare(a.affiliate.createdAt)) });
}
