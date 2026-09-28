import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const walletInitialize = read("../src/app/api/wallet/deposits/initialize/route.ts");
const subscriptionInitialize = read("../src/app/api/subscriptions/initialize/route.ts");
const subscriptionActivate = read("../src/app/api/subscriptions/activate/route.ts");
const subscriptionServer = read("../src/lib/subscriptions/server.ts");
const subscriptionStore = read("../src/lib/subscriptions/store.ts");
const webhook = read("../src/app/api/paystack/webhook/route.ts");
const callback = read("../src/components/subscriptions/subscription-callback.tsx");
const cancellation = read("../src/app/api/subscriptions/cancel/route.ts");

test("wallet and subscription checkouts use separate immutable payment purposes", () => {
  assert.match(walletInitialize, /purpose: "wallet_topup"/);
  assert.match(subscriptionInitialize, /purpose: "subscription"/);
  assert.match(subscriptionInitialize, /createSubscriptionPaymentIntent/);
  assert.match(subscriptionInitialize, /plan: planCode/);
  assert.ok(!subscriptionInitialize.includes("demo: true"));
});

test("subscription callback cannot choose the owner, plan, cycle, or amount", () => {
  assert.deepEqual([...subscriptionActivate.matchAll(/body\?\.(\w+)/g)].map((match) => match[1]), ["reference"]);
  assert.match(subscriptionServer, /getSubscriptionPaymentIntent\(reference\)/);
  for (const marker of ["intent.userId !== userId", "verified.amount !== intent.amountMinor", "verified.currency !== intent.currency", "verified.metadata?.purpose !== \"subscription\"", "verified.metadata?.userId !== intent.userId"]) assert.ok(subscriptionServer.includes(marker), marker);
  assert.ok(!callback.includes("planId"));
  assert.ok(!callback.includes("billingCycle"));
});

test("verified subscription writes and renewals are atomic and idempotent", () => {
  for (const marker of ["commitInitialSubscriptionPayment", "commitRenewalPayment", "runTransaction", "paymentSnap.exists", "intentSnap.data()?.status === \"paid\""]) assert.ok(subscriptionStore.includes(marker), marker);
  assert.match(subscriptionServer, /id: `paystack_\$\{input\.providerTransactionId\}`/);
});

test("single Paystack webhook verifies signatures and routes both payment purposes", () => {
  for (const marker of ["verifyPaystackSignature", "verifyPaystackTransaction", "wallet_topup", "subscription", "processSubscriptionRenewal", "invoice.payment_failed", "refund.processed", "hasPaystackProviderEvent", "recordPaystackProviderEvent"]) assert.ok(webhook.includes(marker), marker);
});

test("subscription cancellation is authenticated and uses Paystack server-side", () => {
  for (const marker of ["verifyCaller", "PAYSTACK_SECRET_KEY", "subscription/disable", "paystackSubscriptionCode", "paystackEmailToken", "non_renewing"]) assert.ok(cancellation.includes(marker), marker);
});

test("financial collections deny direct browser reads and writes", () => {
  const rules = read("../firestore.rules");
  for (const collection of ["subscriptionPayments", "subscriptionPaymentIntents", "paystackProviderEvents"]) assert.match(rules, new RegExp(`match /${collection}\\/\\{[^}]+\\} \\{ allow read, write: if false; \\}`));
});
