import { NextResponse } from "next/server";

import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { getBankingProfile, setBankingProfile } from "@/lib/banking/store";

/** Admin-initiated PIN reset: clears the stored PIN so the customer is prompted to set a new one on their next transfer/reveal (same SetPinGate flow as a first-time setup). */
export async function DELETE(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { uid } = await params;
  const profile = await getBankingProfile(uid);
  if (!profile?.passwordHash) {
    return NextResponse.json({ error: "No banking account found for this user." }, { status: 404 });
  }

  await setBankingProfile({ ...profile, transactionPin: null, updatedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
