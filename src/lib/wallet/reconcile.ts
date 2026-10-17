import "server-only";

import { creditVerifiedDeposit, getFundingIntent } from "@/lib/wallet/store";
import { verifyPaystackTransaction } from "@/lib/wallet/paystack";

export async function reconcileWalletDeposit(reference: string, userId: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Wallet funding verification is not configured.");

  const intent = await getFundingIntent(reference);
  if (!intent || intent.userId !== userId) throw new Error("Funding request not found.");
  if (intent.status !== "pending") return intent;

  const verified = await verifyPaystackTransaction(reference, secret);
  const purpose = String(verified.metadata?.purpose ?? "");
  const verifiedUserId = String(verified.metadata?.userId ?? "");

  if (verified.status !== "success") return intent;
  if (
    verified.reference !== intent.reference ||
    verified.amount !== intent.amountMinor ||
    verified.currency !== intent.currency ||
    !["wallet_topup", "wallet_funding"].includes(purpose) ||
    verifiedUserId !== intent.userId
  ) {
    throw new Error("Verified wallet payment details do not match the funding request.");
  }

  await creditVerifiedDeposit({
    reference: intent.reference,
    providerReference: verified.reference,
    providerTransactionId: String(verified.id ?? verified.reference),
  });

  return await getFundingIntent(reference);
}
