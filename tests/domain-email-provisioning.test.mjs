import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
async function importTs(path) { const source = read(path); const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }); return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`); }

test("an unconfigured domain provider fails explicitly and never simulates success", async () => {
  const { requireDomainProvider } = await importTs("../src/lib/domains/provider.ts");
  const provider = { isConfigured: () => false };
  assert.throws(() => requireDomainProvider(provider), (error) => error?.code === "PROVIDER_NOT_CONFIGURED");
  const service = read("../src/lib/domains/service.ts");
  assert.ok(!service.includes("demo-${order.id}"));
  assert.ok(!service.includes("demo-"));
});

test("automated tests may use a mock provider without adding mock behavior to production", async () => {
  const { requireDomainProvider } = await importTs("../src/lib/domains/provider.ts");
  const calls = [];
  const mock = { name: "mock", isConfigured: () => true, searchAvailability: async (domain) => ({ domain, available: true, providerStatus: "available" }), registerDomain: async ({ domain }) => { calls.push(domain); return { providerDomainId: "mock-1", domain, status: "active", registeredAt: null, expiresAt: null }; } };
  const result = await requireDomainProvider(mock).registerDomain({ domain: "safe.example", years: 1, registrant: { name: "Test", email: "test@example.com" }, idempotencyKey: "one" });
  assert.equal(result.providerDomainId, "mock-1"); assert.deepEqual(calls, ["safe.example"]);
});

test("provider availability is checked before wallet debit or Paystack checkout", () => {
  const wallet = read("../src/app/api/domains/checkout/wallet/route.ts");
  const paystack = read("../src/app/api/domains/checkout/initialize/route.ts");
  assert.ok(wallet.indexOf("!areDomainPurchasesEnabled()") < wallet.indexOf("purchaseWithWallet({"));
  assert.ok(paystack.indexOf("!areDomainPurchasesEnabled()") < paystack.indexOf("transaction/initialize"));
  for (const source of [wallet, paystack]) assert.match(source, /DOMAIN_PURCHASES_DISABLED/);
});

test("registration, wallet reversal, payment verification and retries are idempotent", () => {
  const service = read("../src/lib/domains/service.ts"); const store = read("../src/lib/domains/store.ts"); const wallet = read("../src/app/api/domains/checkout/wallet/route.ts"); const verify = read("../src/app/api/domains/checkout/verify/route.ts");
  assert.match(service, /claimDomainRegistration/); assert.match(store, /runTransaction/); assert.match(store, /registration_pending/); assert.match(wallet, /refundTransaction/);
  for (const marker of ["payment?.amount !== pendingOrder.amountCents", "payment?.currency !== pendingOrder.currency", 'payment?.metadata?.purpose !== "domain_registration"']) assert.ok(verify.includes(marker), marker);
});

test("email sending enforces owner, verified domain, server-built From and suppression", () => {
  const send = read("../src/app/api/email-flash/send/route.ts");
  for (const marker of ["sender.userId !== caller.uid", 'emailDomain.status !== "ready"', "emailDomain.suspended", "sender.address !==", "isRecipientSuppressed", "consumeEmailDomainSendQuota", "emailDomainProvider.sendEmail"]) assert.ok(send.includes(marker), marker);
  assert.ok(!send.includes("body.from")); assert.ok(!send.includes("input.from"));
});

test("delivery webhook is signed and idempotent and can suppress abusive recipients", () => {
  const webhook = read("../src/app/api/email-flash/webhook/route.ts");
  for (const marker of ["verifyWebhook", "claimProviderEvent", "duplicate: true", "releaseProviderEvent", "suppressRecipient", "recordEmailDomainDelivery"]) assert.ok(webhook.includes(marker), marker);
});

test("Firestore denies direct access to registrar and email-domain security records", () => {
  const rules = read("../firestore.rules");
  for (const collection of ["domains", "domainOrders", "domainRegistrarAccounts", "emailDomains", "emailSenderIdentities", "emailProviderEvents", "emailSuppressions", "emailDomainAuditLogs"]) assert.match(rules, new RegExp(`match /${collection}\\/\\{[^}]+\\} \\{ allow read, write: if false; \\}`));
});

test("ResellerClub buyer accounts are per-user and not global environment configuration", () => {
  const provider = read("../src/lib/domains/resellerclub-provider.ts");
  const accountStore = read("../src/lib/domains/registrar-account-store.ts");
  const env = read("../.env.example");
  assert.match(provider, /ensureBuyerAccount/);
  assert.match(provider, /api\/customers\/details\.json/);
  assert.match(provider, /api\/customers\/v2\/signup\.json/);
  assert.match(provider, /api\/contacts\/search\.json/);
  assert.match(accountStore, /domainRegistrarAccounts/);
  assert.ok(!env.includes("RESELLERCLUB_CUSTOMER_ID="));
  assert.ok(!env.includes("RESELLERCLUB_CONTACT_ID="));
});

test("production UI has no fake registrar success and manual DNS cannot claim an update", () => {
  const domainPage = read("../src/app/domains/page.tsx"); const manage = read("../src/app/api/domains/manage/route.ts");
  assert.match(domainPage, /Domain service is being configured/); assert.ok(!manage.includes("saveDomain(")); assert.match(manage, /No DNS change was made/);
});

test("availability uses the signed connector while every purchase path stays feature-flagged", () => {
  const connector = read("../src/lib/domains/connector-client.ts");
  const search = read("../src/app/api/domains/search/route.ts");
  assert.match(connector, /createHmac\("sha256"/);
  assert.match(connector, /X-EazyTool-Timestamp/);
  assert.match(connector, /X-EazyTool-Nonce/);
  assert.match(search, /isResellerClubAvailabilityConfigured/);
  for (const route of ["initialize", "wallet", "verify"]) {
    assert.match(read(`../src/app/api/domains/checkout/${route}/route.ts`), /areDomainPurchasesEnabled/);
  }
});
