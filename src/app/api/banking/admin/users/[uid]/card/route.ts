import { NextResponse } from "next/server";

import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
import { getCardForUser, updateCard } from "@/lib/banking/store";
import type { CardStatus } from "@/lib/banking/types";

const VALID_STATUSES: CardStatus[] = ["active", "frozen", "blocked"];

export async function PATCH(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { uid } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status as CardStatus | undefined;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "status must be one of: active, frozen, blocked." }, { status: 400 });
  }

  const card = await getCardForUser(uid);
  if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

  await updateCard({ ...card, status });
  return NextResponse.json({ status });
}
