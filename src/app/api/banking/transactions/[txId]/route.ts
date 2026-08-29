import { NextResponse } from "next/server";

import { verifyCaller } from "@/lib/licensing/verify-auth";
import { verifyBankingSession } from "@/lib/banking/session";
import { getTransactionById, updateTransaction } from "@/lib/banking/store";
import type { TransactionStatus } from "@/lib/banking/types";

const VALID_STATUSES: TransactionStatus[] = ["pending", "completed", "failed", "cancelled"];

interface EditBody {
  description?: string;
  counterparty?: string;
  counterpartyAccount?: string;
  recipientBank?: string;
  reference?: string;
  status?: TransactionStatus;
}

/**
 * Self-service edit of the caller's OWN transaction receipt — scoped by
 * ownership check (tx.userId === caller.uid), never another user's. Same
 * amount/direction exclusion as the admin version: those drive the
 * balance, and self-adjusting balance goes through account/adjust-balance
 * instead, which creates its own auditable transaction.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ txId: string }> }) {
  const caller = await verifyCaller(request);
  if (!caller) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await verifyBankingSession(request, caller.uid))) {
    return NextResponse.json({ error: "Banking sign-in required." }, { status: 401 });
  }

  const { txId } = await params;
  const body = (await request.json().catch(() => null)) as EditBody | null;
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const tx = await getTransactionById(txId);
  if (!tx || tx.userId !== caller.uid) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }

  const updated = {
    ...tx,
    description: body.description?.trim() || tx.description,
    counterparty: body.counterparty?.trim() ?? tx.counterparty,
    counterpartyAccount: body.counterpartyAccount?.trim() ?? tx.counterpartyAccount,
    recipientBank: body.recipientBank?.trim() ?? tx.recipientBank,
    reference: body.reference?.trim() || tx.reference,
    status: body.status ?? tx.status,
  };
  await updateTransaction(updated);

  return NextResponse.json({ transaction: updated });
}
