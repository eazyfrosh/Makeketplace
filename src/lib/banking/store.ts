// Mirrors src/lib/licensing/store.ts and src/lib/logistics/store.ts's exact
// Admin-SDK-or-in-memory pattern, under its own collection names. Novaofficial's
// own balance/transfer logic is tightly coupled to its own Firebase project
// (like TrackNova was) — this is a fresh backend built the same way the
// licensing system was, reusing only the parts of Novaofficial that are
// pure Node logic (crypto.ts, the rate-limit shape).
import { adminDb, isAdminDbConfigured } from "@/lib/licensing/admin-db";
import type { Account, BankCard, BankingProfile, Transaction } from "@/lib/banking/types";

export const isBankingBackendDurable = isAdminDbConfigured;

const ACCOUNTS = "bankingAccounts";
const TRANSACTIONS = "bankingTransactions";
const CARDS = "bankingCards";
const PROFILES = "bankingProfiles";
const RATE_LIMITS = "bankingRateLimits";

declare global {
  var __nexovaBankingDemoStore:
    | {
        accounts: Map<string, Account>;
        transactions: Map<string, Transaction>;
        cards: Map<string, BankCard>;
        profiles: Map<string, BankingProfile>;
        rateLimits: Map<string, { count: number; windowStart: number }>;
      }
    | undefined;
}

function demoStore() {
  if (!global.__nexovaBankingDemoStore) {
    global.__nexovaBankingDemoStore = {
      accounts: new Map(),
      transactions: new Map(),
      cards: new Map(),
      profiles: new Map(),
      rateLimits: new Map(),
    };
  }
  return global.__nexovaBankingDemoStore;
}

export async function getAccountForUser(userId: string): Promise<Account | null> {
  if (adminDb) {
    const snap = await adminDb.collection(ACCOUNTS).where("userId", "==", userId).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as Account);
  }
  return Array.from(demoStore().accounts.values()).find((a) => a.userId === userId) ?? null;
}

export async function createAccount(account: Account): Promise<void> {
  if (adminDb) {
    await adminDb.collection(ACCOUNTS).doc(account.id).set(account);
    return;
  }
  demoStore().accounts.set(account.id, account);
}

export async function updateAccount(account: Account): Promise<void> {
  if (adminDb) {
    await adminDb.collection(ACCOUNTS).doc(account.id).set(account);
    return;
  }
  demoStore().accounts.set(account.id, account);
}

export async function getCardForUser(userId: string): Promise<BankCard | null> {
  if (adminDb) {
    const snap = await adminDb.collection(CARDS).where("userId", "==", userId).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as BankCard);
  }
  return Array.from(demoStore().cards.values()).find((c) => c.userId === userId) ?? null;
}

export async function createCard(card: BankCard): Promise<void> {
  if (adminDb) {
    await adminDb.collection(CARDS).doc(card.id).set(card);
    return;
  }
  demoStore().cards.set(card.id, card);
}

export async function updateCard(card: BankCard): Promise<void> {
  if (adminDb) {
    await adminDb.collection(CARDS).doc(card.id).set(card);
    return;
  }
  demoStore().cards.set(card.id, card);
}

export async function getTransactionsForUser(userId: string): Promise<Transaction[]> {
  if (adminDb) {
    const snap = await adminDb.collection(TRANSACTIONS).where("userId", "==", userId).get();
    return snap.docs.map((d) => d.data() as Transaction);
  }
  return Array.from(demoStore().transactions.values()).filter((t) => t.userId === userId);
}

export async function createTransaction(tx: Transaction): Promise<void> {
  if (adminDb) {
    await adminDb.collection(TRANSACTIONS).doc(tx.id).set(tx);
    return;
  }
  demoStore().transactions.set(tx.id, tx);
}

export async function getBankingProfile(userId: string): Promise<BankingProfile | null> {
  if (adminDb) {
    const snap = await adminDb.collection(PROFILES).doc(userId).get();
    return snap.exists ? (snap.data() as BankingProfile) : null;
  }
  return demoStore().profiles.get(userId) ?? null;
}

export async function setBankingProfile(profile: BankingProfile): Promise<void> {
  if (adminDb) {
    await adminDb.collection(PROFILES).doc(profile.userId).set(profile);
    return;
  }
  demoStore().profiles.set(profile.userId, profile);
}

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX_ATTEMPTS = 5;

/** Fails open if the Admin SDK is unavailable — rate limiting is a side concern, not the primary security boundary (the PIN check itself is). */
export async function checkAndRecordPinAttempt(key: string): Promise<{ allowed: boolean; remaining: number }> {
  if (!adminDb) {
    const store = demoStore().rateLimits;
    const now = Date.now();
    const data = store.get(key);
    if (!data || now - data.windowStart > RATE_WINDOW_MS) {
      store.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: RATE_MAX_ATTEMPTS - 1 };
    }
    if (data.count >= RATE_MAX_ATTEMPTS) return { allowed: false, remaining: 0 };
    data.count += 1;
    return { allowed: true, remaining: RATE_MAX_ATTEMPTS - data.count };
  }

  const ref = adminDb.collection(RATE_LIMITS).doc(key);
  const snap = await ref.get();
  const now = Date.now();
  const data = snap.data() as { count: number; windowStart: number } | undefined;

  if (!data || now - data.windowStart > RATE_WINDOW_MS) {
    await ref.set({ count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_MAX_ATTEMPTS - 1 };
  }
  if (data.count >= RATE_MAX_ATTEMPTS) return { allowed: false, remaining: 0 };
  await ref.update({ count: data.count + 1 });
  return { allowed: true, remaining: RATE_MAX_ATTEMPTS - data.count - 1 };
}

export async function resetPinAttempts(key: string): Promise<void> {
  if (!adminDb) {
    demoStore().rateLimits.delete(key);
    return;
  }
  await adminDb.collection(RATE_LIMITS).doc(key).delete().catch(() => {});
}
