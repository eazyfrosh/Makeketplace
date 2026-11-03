import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const billingSource = readFileSync(new URL("../src/lib/subscriptions/billing-period.ts", import.meta.url), "utf8");
const billingJavaScript = ts.transpileModule(billingSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const billingPeriod = await import(`data:text/javascript;base64,${Buffer.from(billingJavaScript).toString("base64")}`);
const storeSource = readFileSync(new URL("../src/lib/subscriptions/store.ts", import.meta.url), "utf8");
const storeJavaScript = ts.transpileModule(storeSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function createStore() {
  const collections = new Map();
  const docs = (name) => {
    if (!collections.has(name)) collections.set(name, new Map());
    return collections.get(name);
  };
  const adminDb = {
    collection(name) {
      return {
        doc(id) { return { name, id }; },
        async get() { return { docs: Array.from(docs(name).values(), (value) => ({ data: () => value })) }; },
      };
    },
    async runTransaction(callback) {
      const tx = {
        async get(ref) {
          const value = docs(ref.name).get(ref.id);
          return { exists: value !== undefined, data: () => value };
        },
        set(ref, value, options) {
          docs(ref.name).set(ref.id, options?.merge ? { ...docs(ref.name).get(ref.id), ...value } : value);
        },
        update(ref, value) { docs(ref.name).set(ref.id, { ...docs(ref.name).get(ref.id), ...value }); },
        create(ref, value) {
          assert.equal(docs(ref.name).has(ref.id), false);
          docs(ref.name).set(ref.id, value);
        },
      };
      return callback(tx);
    },
  };
  const compiledModule = { exports: {} };
  runInNewContext(storeJavaScript, {
    module: compiledModule,
    exports: compiledModule.exports,
    require(specifier) {
      if (specifier === "@/lib/licensing/admin-db") return { adminDb, isAdminDbConfigured: true };
      if (specifier === "@/lib/subscriptions/plans") return { DEFAULT_SUBSCRIPTION_PLANS: [] };
      if (specifier === "@/lib/subscriptions/billing-period") return billingPeriod;
      throw new Error(`Unexpected import: ${specifier}`);
    },
  });
  return { store: compiledModule.exports, docs };
}

const currentSubscription = {
  id: "sub_user-1", userId: "user-1", email: "member@example.com", planId: "all-access",
  billingCycle: "monthly", status: "active", paystackSubscriptionCode: "SUB_OLD",
  paystackCustomerCode: "CUS_SHARED", expiresAt: "2026-12-31T12:00:00.000Z",
  nextBillingAt: "2026-12-31T12:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z",
};

function renewal() {
  return {
    subscription: { ...currentSubscription, expiresAt: "2026-12-03T12:00:00.000Z", updatedAt: "2026-11-03T12:00:00.000Z" },
    payment: { id: "paystack_123", subscriptionId: currentSubscription.id, userId: currentSubscription.userId, billingCycle: "monthly", paidAt: "2026-11-03T12:00:00.000Z" },
  };
}

test("verified legacy renewal extends the current expiry atomically and only once", async () => {
  const { store, docs } = createStore();
  docs("subscriptions").set(currentSubscription.id, { ...currentSubscription });
  const committedAfter = Date.now();
  assert.equal(await store.commitRenewalPayment(renewal()), true);
  const saved = docs("subscriptions").get(currentSubscription.id);
  assert.equal(saved.expiresAt, "2027-01-31T12:00:00.000Z");
  assert.equal(saved.nextBillingAt, saved.expiresAt);
  assert.ok(Date.parse(saved.updatedAt) >= committedAfter);
  assert.equal(docs("subscriptionPayments").size, 1);
  assert.equal(await store.commitRenewalPayment(renewal()), false);
  assert.equal(docs("subscriptions").get(currentSubscription.id).expiresAt, saved.expiresAt);
});

test("stale renewal cannot replace a newer one-time subscription", async () => {
  for (const billingCycle of ["six_months", "yearly"]) {
    const { store, docs } = createStore();
    const newer = { ...currentSubscription, billingCycle, paystackSubscriptionCode: null, expiresAt: "2027-11-03T12:00:00.000Z" };
    docs("subscriptions").set(currentSubscription.id, newer);
    assert.equal(await store.commitRenewalPayment(renewal()), false);
    assert.equal(docs("subscriptions").get(currentSubscription.id), newer);
    assert.equal(docs("subscriptionPayments").size, 0);
  }
});

test("provider lookup and status update require the exact legacy subscription code", async () => {
  const { store, docs } = createStore();
  docs("subscriptions").set(currentSubscription.id, { ...currentSubscription });
  assert.equal(await store.findSubscriptionByProvider({ subscriptionCode: "SUB_OTHER", customerCode: "CUS_SHARED", email: "member@example.com" }), null);
  const committedAfter = Date.now();
  assert.equal(await store.commitProviderSubscriptionStatus({ subscriptionId: currentSubscription.id, subscriptionCode: "SUB_OLD", status: "past_due", customerCode: null, emailToken: null, nextBillingAt: null }), true);
  assert.equal(docs("subscriptions").get(currentSubscription.id).status, "past_due");
  assert.ok(Date.parse(docs("subscriptions").get(currentSubscription.id).updatedAt) >= committedAfter);
  const newer = { ...currentSubscription, status: "active", paystackSubscriptionCode: null };
  docs("subscriptions").set(currentSubscription.id, newer);
  assert.equal(await store.commitProviderSubscriptionStatus({ subscriptionId: currentSubscription.id, subscriptionCode: "SUB_OLD", status: "past_due", customerCode: null, emailToken: null, nextBillingAt: null }), false);
  assert.equal(docs("subscriptions").get(currentSubscription.id), newer);
});
