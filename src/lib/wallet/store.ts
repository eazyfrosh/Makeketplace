import "server-only";
import { adminDb } from "@/lib/licensing/admin-db";
import { walletLimits } from "@/lib/wallet/config";
import type { Wallet, WalletFundingIntent, WalletTransaction, WalletTransactionStatus, WalletTransactionType } from "@/lib/wallet/types";

const WALLETS = "wallets";
const TRANSACTIONS = "wallet_transactions";
const INTENTS = "wallet_funding_intents";
const AUDIT = "wallet_audit_logs";

function requireDb() {
  if (!adminDb) throw new Error("Wallet storage is unavailable. Configure Firebase Admin credentials.");
  return adminDb;
}

function assertMinorAmount(amountMinor: number) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new Error("Amount must be a positive integer in minor units.");
}

function emptyWallet(userId: string, now = new Date().toISOString()): Wallet {
  return { userId, currency: "NGN", balanceMinor: 0, totalDepositedMinor: 0, totalSpentMinor: 0, createdAt: now, updatedAt: now };
}

export async function getOrCreateWallet(userId: string) {
  const db = requireDb();
  const ref = db.collection(WALLETS).doc(userId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) return snap.data() as Wallet;
    const wallet = emptyWallet(userId);
    tx.create(ref, wallet);
    return wallet;
  });
}

export async function createFundingIntent(input: { userId: string; email: string; amountMinor: number; reference: string }) {
  assertMinorAmount(input.amountMinor);
  const db = requireDb();
  const now = new Date().toISOString();
  const id = input.reference;
  const intent: WalletFundingIntent = { id, userId: input.userId, email: input.email, amountMinor: input.amountMinor, currency: "NGN", purpose: "wallet_topup", reference: input.reference, status: "pending", provider: "paystack", providerReference: null, transactionId: null, createdAt: now, updatedAt: now };
  await db.runTransaction(async (tx) => {
    const walletRef = db.collection(WALLETS).doc(input.userId);
    const intentRef = db.collection(INTENTS).doc(id);
    const [walletSnap, intentSnap] = await Promise.all([tx.get(walletRef), tx.get(intentRef)]);
    if (intentSnap.exists) throw new Error("A funding request with this reference already exists.");
    const wallet = walletSnap.exists ? walletSnap.data() as Wallet : emptyWallet(input.userId, now);
    if (wallet.currency !== "NGN") throw new Error("Wallet currency does not match the deposit currency.");
    if (wallet.balanceMinor + input.amountMinor > walletLimits.maximumWalletBalanceMinor) throw new Error("This deposit would exceed the maximum wallet balance.");
    if (!walletSnap.exists) tx.create(walletRef, wallet);
    tx.create(intentRef, intent);
  });
  return intent;
}

export async function getFundingIntent(reference: string) {
  const snap = await requireDb().collection(INTENTS).doc(reference).get();
  return snap.exists ? snap.data() as WalletFundingIntent : null;
}

export async function getDailyCompletedDeposits(userId: string) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const snapshot = await requireDb().collection(TRANSACTIONS)
    .where("userId", "==", userId).where("type", "==", "deposit").where("status", "==", "completed")
    .where("createdAt", ">=", start.toISOString()).get();
  return snapshot.docs.reduce((sum, doc) => sum + Number(doc.data().amountMinor ?? 0), 0);
}

export async function creditVerifiedDeposit(input: { reference: string; providerReference: string; providerTransactionId: string }) {
  const db = requireDb();
  const intentRef = db.collection(INTENTS).doc(input.reference);
  const ledgerRef = db.collection(TRANSACTIONS).doc(`paystack_${input.providerTransactionId}`);
  return db.runTransaction(async (tx) => {
    const [intentSnap, ledgerSnap] = await Promise.all([tx.get(intentRef), tx.get(ledgerRef)]);
    if (!intentSnap.exists) throw new Error("Funding intent not found.");
    const intent = intentSnap.data() as WalletFundingIntent;
    if (ledgerSnap.exists || intent.status === "completed") return ledgerSnap.exists ? ledgerSnap.data() as WalletTransaction : null;
    if (intent.status !== "pending") throw new Error("Funding intent is no longer payable.");
    const walletRef = db.collection(WALLETS).doc(intent.userId);
    const walletSnap = await tx.get(walletRef);
    const wallet = walletSnap.exists ? walletSnap.data() as Wallet : emptyWallet(intent.userId);
    if (wallet.balanceMinor + intent.amountMinor > walletLimits.maximumWalletBalanceMinor) throw new Error("Deposit exceeds the maximum wallet balance.");
    const now = new Date().toISOString();
    const fundingDate = now.slice(0, 10); const fundedToday = wallet.dailyFundingDate === fundingDate ? wallet.dailyFundingMinor ?? 0 : 0;
    if (fundedToday + intent.amountMinor > walletLimits.maximumDailyFundingMinor) throw new Error("Deposit exceeds the daily funding limit.");
    const entry: WalletTransaction = { id: ledgerRef.id, userId: intent.userId, type: "deposit", amountMinor: intent.amountMinor, currency: "NGN", direction: "credit", status: "completed", description: "Wallet deposit", reference: intent.reference, provider: "paystack", providerReference: input.providerReference, serviceType: null, serviceId: null, relatedTransactionId: null, metadata: { purpose: "wallet_topup" }, createdAt: now, updatedAt: now };
    tx.set(walletRef, { ...wallet, balanceMinor: wallet.balanceMinor + intent.amountMinor, totalDepositedMinor: wallet.totalDepositedMinor + intent.amountMinor, dailyFundingDate: fundingDate, dailyFundingMinor: fundedToday + intent.amountMinor, updatedAt: now });
    tx.create(ledgerRef, entry);
    tx.update(intentRef, { status: "completed", providerReference: input.providerReference, transactionId: entry.id, updatedAt: now });
    return entry;
  });
}

export async function failFundingIntent(reference: string) {
  const db = requireDb(); const ref = db.collection(INTENTS).doc(reference);
  await db.runTransaction(async (tx) => { const snap = await tx.get(ref); if (snap.exists && snap.data()?.status === "pending") tx.update(ref, { status: "failed", updatedAt: new Date().toISOString() }); });
}

export async function reverseVerifiedDeposit(input: { reference: string; refundReference: string }) {
  const db = requireDb();
  const depositQuery = await db.collection(TRANSACTIONS).where("reference", "==", input.reference).where("type", "==", "deposit").limit(1).get();
  if (depositQuery.empty) return false;
  const depositRef = depositQuery.docs[0].ref;
  const reversalRef = db.collection(TRANSACTIONS).doc(`refund_${input.refundReference}`);
  return db.runTransaction(async (tx) => {
    const [depositSnap, reversalSnap] = await Promise.all([tx.get(depositRef), tx.get(reversalRef)]);
    if (reversalSnap.exists || depositSnap.data()?.status === "refunded") return false;
    const deposit = depositSnap.data() as WalletTransaction;
    const walletRef = db.collection(WALLETS).doc(deposit.userId);
    const walletSnap = await tx.get(walletRef);
    if (!walletSnap.exists) throw new Error("Wallet not found for refunded deposit.");
    const wallet = walletSnap.data() as Wallet;
    if (wallet.balanceMinor < deposit.amountMinor) throw new Error("Refunded wallet deposit has already been spent; manual reconciliation is required.");
    const now = new Date().toISOString();
    const reversal: WalletTransaction = { id: reversalRef.id, userId: deposit.userId, type: "reversal", amountMinor: deposit.amountMinor, currency: deposit.currency, direction: "debit", status: "completed", description: "Paystack wallet deposit refund", reference: input.refundReference, provider: "paystack", providerReference: input.refundReference, serviceType: null, serviceId: null, relatedTransactionId: deposit.id, metadata: { originalReference: deposit.reference }, createdAt: now, updatedAt: now };
    tx.update(walletRef, { balanceMinor: wallet.balanceMinor - deposit.amountMinor, updatedAt: now });
    tx.update(depositRef, { status: "refunded", updatedAt: now });
    tx.create(reversalRef, reversal);
    tx.create(db.collection(AUDIT).doc(), { actorUserId: "paystack", action: "deposit_refund", targetUserId: deposit.userId, amountMinor: deposit.amountMinor, currency: deposit.currency, reference: input.refundReference, transactionId: reversal.id, reason: "Verified Paystack refund", timestamp: now, metadata: { originalReference: deposit.reference } });
    return true;
  });
}

export async function debitWallet(input: { userId: string; amountMinor: number; reference: string; description: string; serviceType: string; serviceId: string; metadata?: WalletTransaction["metadata"] }) {
  assertMinorAmount(input.amountMinor);
  const db = requireDb(); const ledgerRef = db.collection(TRANSACTIONS).doc(`purchase_${input.reference}`);
  return db.runTransaction(async (tx) => {
    const walletRef = db.collection(WALLETS).doc(input.userId);
    const [walletSnap, ledgerSnap] = await Promise.all([tx.get(walletRef), tx.get(ledgerRef)]);
    if (ledgerSnap.exists) return ledgerSnap.data() as WalletTransaction;
    const wallet = walletSnap.exists ? walletSnap.data() as Wallet : emptyWallet(input.userId);
    if (wallet.balanceMinor < input.amountMinor) throw new Error("INSUFFICIENT_BALANCE");
    const now = new Date().toISOString();
    const entry: WalletTransaction = { id: ledgerRef.id, userId: input.userId, type: "purchase", amountMinor: input.amountMinor, currency: "NGN", direction: "debit", status: "completed", description: input.description, reference: input.reference, provider: "wallet", providerReference: null, serviceType: input.serviceType, serviceId: input.serviceId, relatedTransactionId: null, metadata: input.metadata ?? {}, createdAt: now, updatedAt: now };
    tx.set(walletRef, { ...wallet, balanceMinor: wallet.balanceMinor - input.amountMinor, totalSpentMinor: wallet.totalSpentMinor + input.amountMinor, updatedAt: now });
    tx.create(ledgerRef, entry); return entry;
  });
}

export async function refundTransaction(input: { transactionId: string; actorUserId: string; reason: string; type?: "refund" | "reversal" }) {
  const db = requireDb(); const originalRef = db.collection(TRANSACTIONS).doc(input.transactionId); const refundRef = db.collection(TRANSACTIONS).doc(`refund_${input.transactionId}`);
  return db.runTransaction(async (tx) => {
    const [originalSnap, refundSnap] = await Promise.all([tx.get(originalRef), tx.get(refundRef)]);
    if (!originalSnap.exists) throw new Error("Transaction not found.");
    if (refundSnap.exists) return refundSnap.data() as WalletTransaction;
    const original = originalSnap.data() as WalletTransaction;
    if (original.type !== "purchase" || original.direction !== "debit" || original.status !== "completed") throw new Error("This transaction cannot be refunded.");
    const walletRef = db.collection(WALLETS).doc(original.userId); const walletSnap = await tx.get(walletRef); const wallet = walletSnap.data() as Wallet;
    const now = new Date().toISOString(); const type = input.type ?? "refund";
    const entry: WalletTransaction = { ...original, id: refundRef.id, type, direction: "credit", status: "completed", description: `${type === "reversal" ? "Reversal" : "Refund"}: ${original.description}`, reference: `${type}_${original.reference}`, provider: "wallet", providerReference: null, relatedTransactionId: original.id, metadata: { reason: input.reason }, createdAt: now, updatedAt: now };
    tx.update(walletRef, { balanceMinor: wallet.balanceMinor + original.amountMinor, updatedAt: now });
    tx.update(originalRef, { status: type === "reversal" ? "reversed" : "refunded", updatedAt: now });
    tx.create(refundRef, entry);
    tx.create(db.collection(AUDIT).doc(), { actorUserId: input.actorUserId, action: type, targetUserId: original.userId, amountMinor: original.amountMinor, currency: original.currency, reference: entry.reference, transactionId: entry.id, reason: input.reason, timestamp: now, metadata: {} });
    return entry;
  });
}

export async function adjustWallet(input: { adminUserId: string; targetUserId: string; amountMinor: number; direction: "credit" | "debit"; reason: string; reference: string }) {
  assertMinorAmount(input.amountMinor); if (!input.reason.trim()) throw new Error("A reason is required.");
  const db = requireDb(); const ledgerRef = db.collection(TRANSACTIONS).doc(`adjustment_${input.reference}`);
  return db.runTransaction(async (tx) => {
    const walletRef = db.collection(WALLETS).doc(input.targetUserId); const [walletSnap, ledgerSnap] = await Promise.all([tx.get(walletRef), tx.get(ledgerRef)]);
    if (ledgerSnap.exists) return ledgerSnap.data() as WalletTransaction;
    const wallet = walletSnap.exists ? walletSnap.data() as Wallet : emptyWallet(input.targetUserId); const delta = input.direction === "credit" ? input.amountMinor : -input.amountMinor;
    if (wallet.balanceMinor + delta < 0) throw new Error("Adjustment would make the wallet balance negative.");
    if (wallet.balanceMinor + delta > walletLimits.maximumWalletBalanceMinor) throw new Error("Adjustment would exceed the maximum wallet balance.");
    const now = new Date().toISOString(); const entry: WalletTransaction = { id: ledgerRef.id, userId: input.targetUserId, type: "adjustment", amountMinor: input.amountMinor, currency: "NGN", direction: input.direction, status: "completed", description: input.reason.trim(), reference: input.reference, provider: "admin", providerReference: null, serviceType: null, serviceId: null, relatedTransactionId: null, metadata: { adminUserId: input.adminUserId }, createdAt: now, updatedAt: now };
    tx.set(walletRef, { ...wallet, balanceMinor: wallet.balanceMinor + delta, updatedAt: now }); tx.create(ledgerRef, entry);
    tx.create(db.collection(AUDIT).doc(), { actorUserId: input.adminUserId, action: "wallet_adjustment", targetUserId: input.targetUserId, amountMinor: input.amountMinor, currency: "NGN", direction: input.direction, reference: input.reference, transactionId: entry.id, reason: input.reason.trim(), timestamp: now, metadata: {} }); return entry;
  });
}

export async function listWalletTransactions(userId: string, options: { limit?: number; cursor?: string; type?: WalletTransactionType; status?: WalletTransactionStatus } = {}) {
  const db = requireDb(); const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
  let query: FirebaseFirestore.Query = db.collection(TRANSACTIONS).where("userId", "==", userId).orderBy("createdAt", "desc");
  if (options.type) query = query.where("type", "==", options.type);
  if (options.status) query = query.where("status", "==", options.status);
  if (options.cursor) { const cursorSnap = await db.collection(TRANSACTIONS).doc(options.cursor).get(); if (cursorSnap.exists && cursorSnap.data()?.userId === userId) query = query.startAfter(cursorSnap); }
  const snapshot = await query.limit(limit + 1).get(); const docs = snapshot.docs.slice(0, limit);
  return { transactions: docs.map((doc) => doc.data() as WalletTransaction), nextCursor: snapshot.docs.length > limit ? docs.at(-1)?.id ?? null : null };
}

export async function getWalletTransaction(id: string) { const snap = await requireDb().collection(TRANSACTIONS).doc(id).get(); return snap.exists ? snap.data() as WalletTransaction : null; }

export async function listWallets(limit = 100) { const snap = await requireDb().collection(WALLETS).orderBy("updatedAt", "desc").limit(Math.min(limit, 200)).get(); return snap.docs.map((d) => d.data() as Wallet); }
export async function listAllWalletTransactions(limit = 500) { const snap = await requireDb().collection(TRANSACTIONS).orderBy("createdAt", "desc").limit(Math.min(limit, 1000)).get(); return snap.docs.map((d) => d.data() as WalletTransaction); }
