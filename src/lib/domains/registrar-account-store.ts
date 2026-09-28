import "server-only";

import { adminDb } from "@/lib/licensing/admin-db";

export interface RegistrarAccountRecord {
  userId: string;
  provider: "resellerclub";
  providerCustomerId: string;
  providerContactId?: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
}

const COLLECTION = "domainRegistrarAccounts";

export async function getRegistrarAccount(userId: string) {
  if (!adminDb) throw new Error("Registrar account storage is unavailable. Configure Firebase Admin credentials.");
  const snapshot = await adminDb.collection(COLLECTION).doc(userId).get();
  return snapshot.exists ? snapshot.data() as RegistrarAccountRecord : null;
}

export async function saveRegistrarAccount(account: RegistrarAccountRecord) {
  if (!adminDb) throw new Error("Registrar account storage is unavailable. Configure Firebase Admin credentials.");
  await adminDb.collection(COLLECTION).doc(account.userId).set(account, { merge: true });
}
