import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { generateId } from "@/lib/licensing/keys";
import {
  createPayoutRequest,
  getAffiliateByUserId,
  getCommissionsForAffiliate,
  updateCommission,
} from "@/lib/affiliate/store";
import type { AffiliatePayoutRequest } from "@/lib/affiliate/types";

/**
 * Simulated payout: no real money moves (checkout itself is demo-mode by
 * default), but the full request -> admin-resolves workflow exists and is
 * trackable. Requests the affiliate's entire current pending balance —
 * linking every pending commission to this request so an admin resolving
 * it later knows exactly which ones it covers.
 */
export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const affiliate = await getAffiliateByUserId(caller.uid);
  if (!affiliate) return NextResponse.json({ error: "You're not an affiliate yet." }, { status: 404 });

  const commissions = await getCommissionsForAffiliate(affiliate.id);
  const pending = commissions.filter((c) => c.status === "pending" && !c.payoutRequestId);
  const amountCents = pending.reduce((sum, c) => sum + c.commissionCents, 0);
  if (amountCents <= 0) {
    return NextResponse.json({ error: "You don't have any pending commissions to request." }, { status: 400 });
  }

  const payoutRequest: AffiliatePayoutRequest = {
    id: generateId("payout"),
    affiliateId: affiliate.id,
    amountCents,
    status: "requested",
    requestedAt: new Date().toISOString(),
    resolvedAt: null,
  };
  await createPayoutRequest(payoutRequest);
  await Promise.all(pending.map((c) => updateCommission({ ...c, payoutRequestId: payoutRequest.id })));

  return NextResponse.json({ payoutRequest });
}
