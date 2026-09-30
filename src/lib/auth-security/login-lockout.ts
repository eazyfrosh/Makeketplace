import "server-only";

import { createHash } from "node:crypto";
import { adminDb } from "@/lib/licensing/admin-db";

const COLLECTION = "auth_login_limits";
export const MAX_LOGIN_ATTEMPTS = Math.max(1, Number(process.env.LOGIN_MAX_ATTEMPTS ?? 5) || 5);
export const LOGIN_LOCKOUT_MINUTES = Math.max(1, Number(process.env.LOGIN_LOCKOUT_MINUTES ?? 30) || 30);

function key(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function database() {
  if (!adminDb) throw new Error("LOGIN_LOCKOUT_UNAVAILABLE");
  return adminDb;
}

export async function checkLoginAllowed(email: string) {
  const snapshot = await database().collection(COLLECTION).doc(key(email)).get();
  const lockedUntil = Number(snapshot.data()?.lockedUntil ?? 0);
  const now = Date.now();
  return { allowed: lockedUntil <= now, retryAfterSeconds: lockedUntil > now ? Math.ceil((lockedUntil - now) / 1000) : 0 };
}

export async function recordLoginFailure(email: string) {
  const db = database();
  const ref = db.collection(COLLECTION).doc(key(email));
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const now = Date.now();
    const previous = snapshot.data();
    if (Number(previous?.lockedUntil ?? 0) > now) {
      return { allowed: false, attemptsRemaining: 0, retryAfterSeconds: Math.ceil((Number(previous?.lockedUntil) - now) / 1000) };
    }
    const failedAttempts = Number(previous?.failedAttempts ?? 0) + 1;
    const lockedUntil = failedAttempts >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_LOCKOUT_MINUTES * 60_000 : 0;
    transaction.set(ref, { failedAttempts: lockedUntil ? 0 : failedAttempts, lockedUntil, updatedAt: new Date(now).toISOString() });
    return { allowed: !lockedUntil, attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - failedAttempts), retryAfterSeconds: lockedUntil ? LOGIN_LOCKOUT_MINUTES * 60 : 0 };
  });
}

export async function clearLoginFailures(email: string) {
  await database().collection(COLLECTION).doc(key(email)).delete().catch(() => undefined);
}
