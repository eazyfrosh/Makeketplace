import { NextResponse } from "next/server";

import { verifyAdminCaller } from "@/lib/licensing/verify-auth";
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
 * Edits a transaction's receipt-facing details only — description,
 * counterparty info, reference, status. Deliberately does NOT allow editing
 * amount/direction/accountId: those drive the account balance, and this
 * route never touches the balance. A correction that should actually move
 * money belongs in the adjust-balance action instead, which creates its own
 * auditable transaction rather than silently rewriting history.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string; txId: string }> },
) {
  const admin = await verifyAdminCaller(request);
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { uid, txId } = await params;
  const body = (await request.json().catch(() => null)) as EditBody | null;
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const tx = await getTransactionById(txId);
  if (!tx || tx.userId !== uid) {
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
