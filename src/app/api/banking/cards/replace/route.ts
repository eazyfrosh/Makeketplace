import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { getCardForUser, updateCard } from "@/lib/banking/store";

export async function POST(request: Request) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const card = await getCardForUser(caller.uid);
  if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

  const updated = {
    ...card,
    cardNumber: `4${Math.floor(100000000000000 + Math.random() * 899999999999999)}`,
    cvv: String(Math.floor(100 + Math.random() * 899)),
    status: "active" as const,
    expiryYear: String(new Date().getFullYear() + 4),
  };
  await updateCard(updated);

  return NextResponse.json({ ok: true });
}
