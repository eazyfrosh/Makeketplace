import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifyBankingSession } from "@/lib/banking/session";
import { getCardForUser, updateCard } from "@/lib/banking/store";

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await verifyBankingSession(request, caller.uid))) {
    return NextResponse.json({ error: "Banking sign-in required." }, { status: 401 });
  }

  const card = await getCardForUser(caller.uid);
  if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

  const status = card.status === "frozen" ? "active" : "frozen";
  await updateCard({ ...card, status });

  return NextResponse.json({ status });
}
