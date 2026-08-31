import { NextResponse } from "next/server";

import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import {
  getAffiliateById,
  getCommissionsForAffiliate,
  getPayoutRequestById,
  updateCommission,
  updatePayoutRequest,
} from "@/lib/affiliate/store";

interface ResolveBody {
  action: "paid" | "rejected";
}

/**
 * "paid" marks the request and every commission it covers as paid.
 * "rejected" unlinks those commissions so they go back to being ordinary
 * pending commissions the affiliate can include in a future request.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as ResolveBody | null;
  if (body?.action !== "paid" && body?.action !== "rejected") {
    return NextResponse.json({ error: "action must be 'paid' or 'rejected'." }, { status: 400 });
  }

  const payoutRequest = await getPayoutRequestById(id);
  if (!payoutRequest) return NextResponse.json({ error: "Payout request not found." }, { status: 404 });
  if (payoutRequest.status !== "requested") {
    return NextResponse.json({ error: "This request has already been resolved." }, { status: 400 });
  }

  const affiliate = await getAffiliateById(payoutRequest.affiliateId);
  if (!affiliate) return NextResponse.json({ error: "Affiliate not found." }, { status: 404 });

  const commissions = await getCommissionsForAffiliate(affiliate.id);
  const covered = commissions.filter((c) => c.payoutRequestId === payoutRequest.id);

  await Promise.all(
    covered.map((c) =>
      updateCommission(
        body.action === "paid" ? { ...c, status: "paid" } : { ...c, payoutRequestId: null },
      ),
    ),
  );

  const resolved = { ...payoutRequest, status: body.action, resolvedAt: new Date().toISOString() };
  await updatePayoutRequest(resolved);

  return NextResponse.json({ payoutRequest: resolved });
}
