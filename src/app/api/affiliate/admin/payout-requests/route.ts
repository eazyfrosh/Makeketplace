import { NextResponse } from "next/server";

import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { getAffiliateById, getAllPayoutRequests } from "@/lib/affiliate/store";

export async function GET(request: Request) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const requests = await getAllPayoutRequests();
  const rows = await Promise.all(
    requests.map(async (payoutRequest) => ({
      payoutRequest,
      affiliate: await getAffiliateById(payoutRequest.affiliateId),
    })),
  );

  return NextResponse.json({
    rows: rows.sort((a, b) => b.payoutRequest.requestedAt.localeCompare(a.payoutRequest.requestedAt)),
  });
}
