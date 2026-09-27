import "server-only";

import { adminDb } from "@/lib/licensing/admin-db";
import type { ReceiptEmailLineItem, ReceiptTransactionOption } from "@/lib/receipt-email/types";

function requireDb() {
  if (!adminDb) throw new Error("Receipt email storage is unavailable. Configure Firebase Admin credentials.");
  return adminDb;
}

function option(value: ReceiptTransactionOption) {
  return value;
}

export async function listReceiptTransactions(userId: string): Promise<ReceiptTransactionOption[]> {
  const db = requireDb();
  const [orders, wallet, subscriptions, domains] = await Promise.all([
    db.collection("orders").where("userId", "==", userId).limit(50).get(),
    db.collection("wallet_transactions").where("userId", "==", userId).limit(50).get(),
    db.collection("subscriptionPayments").where("userId", "==", userId).limit(50).get(),
    db.collection("domainOrders").where("userId", "==", userId).limit(50).get(),
  ]);

  const items: ReceiptTransactionOption[] = [];
  for (const doc of orders.docs) {
    const data = doc.data();
    if (data.status !== "paid") continue;
    const lineItems: ReceiptEmailLineItem[] = Array.isArray(data.items)
      ? data.items.map((item: Record<string, unknown>) => ({
          description: String(item.serviceName ?? item.packageName ?? "EazyTools purchase"),
          quantity: 1,
          unitAmountMinor: Number(item.priceCents ?? 0),
        }))
      : [{ description: "EazyTools purchase", quantity: 1, unitAmountMinor: Number(data.totalCents ?? 0) }];
    items.push(option({ id: doc.id, type: "order", reference: String(data.paymentReference ?? doc.id), description: "EazyTools order", amountMinor: Number(data.totalCents ?? 0), currency: "NGN", occurredAt: String(data.createdAt ?? ""), lineItems }));
  }
  for (const doc of wallet.docs) {
    const data = doc.data();
    if (!["completed", "refunded"].includes(String(data.status))) continue;
    const amount = Number(data.amountMinor ?? 0);
    items.push(option({ id: doc.id, type: "wallet", reference: String(data.reference ?? doc.id), description: String(data.description ?? "Wallet transaction"), amountMinor: amount, currency: String(data.currency ?? "NGN"), occurredAt: String(data.createdAt ?? ""), lineItems: [{ description: String(data.description ?? "Wallet transaction"), quantity: 1, unitAmountMinor: amount }] }));
  }
  for (const doc of subscriptions.docs) {
    const data = doc.data();
    if (data.status !== "paid") continue;
    const amount = Number(data.amountCents ?? 0);
    items.push(option({ id: doc.id, type: "subscription", reference: String(data.reference ?? doc.id), description: "EazyTools subscription", amountMinor: amount, currency: "NGN", occurredAt: String(data.paidAt ?? data.createdAt ?? ""), lineItems: [{ description: "EazyTools subscription", quantity: 1, unitAmountMinor: amount }] }));
  }
  for (const doc of domains.docs) {
    const data = doc.data();
    if (data.paymentStatus !== "paid") continue;
    const amount = Number(data.amountCents ?? 0);
    items.push(option({ id: doc.id, type: "domain", reference: String(data.paystackReference ?? doc.id), description: `Domain registration: ${String(data.domain ?? "domain")}`, amountMinor: amount, currency: String(data.currency ?? "NGN"), occurredAt: String(data.createdAt ?? ""), lineItems: [{ description: `Domain registration: ${String(data.domain ?? "domain")}`, quantity: 1, unitAmountMinor: amount }] }));
  }
  return items
    .filter((item) => Number.isSafeInteger(item.amountMinor) && item.amountMinor >= 0)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, 100);
}

export async function getReceiptTransaction(userId: string, id: string) {
  return (await listReceiptTransactions(userId)).find((item) => item.id === id) ?? null;
}
