import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID = "DBCURCBC77U4J2JQ9R50";
process.env.NEXT_PUBLIC_TIKTOK_PRIVACY_REVIEWED = "true";
const source = readFileSync(new URL("../src/lib/analytics/tiktok.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const pixel = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

const storage = new Map();
const calls = [];
globalThis.window = {
  location: { pathname: "/pricing", search: "", hostname: "eazytool.app" },
  localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  ttq: {
    page: () => calls.push(["page"]),
    track: (name, params) => calls.push(["track", name, params]),
    ready: (callback) => callback(),
    grantConsent: () => calls.push(["grant"]),
    revokeConsent: () => calls.push(["revoke"]),
  },
};
globalThis.document = { cookie: "" };

test("requires explicit marketing consent and blocks unsafe pages or query parameters", () => {
  assert.equal(pixel.tiktokConfigured(), true);
  assert.equal(pixel.readMarketingConsent(), null);
  assert.equal(pixel.safeTikTokPage("/pricing", "?utm_source=tiktok&ttclid=E.C.test_123"), true);
  assert.equal(pixel.safeTikTokPage("/subscription/callback", "?reference=private"), false);
  assert.equal(pixel.safeTikTokPage("/dashboard", ""), false);
  assert.equal(pixel.safeTikTokPage("/auth/signup", "?email=private@example.com"), false);
  assert.equal(pixel.safeTikTokPage("/pricing", "?utm_campaign=private@example.com"), false);
  assert.equal(pixel.trackTikTokPageView("/pricing", ""), false);
  assert.equal(pixel.trackTikTokRegistration(), false);
  assert.equal(calls.length, 0);
  pixel.saveMarketingConsent("accepted");
  assert.equal(pixel.readMarketingConsent(), "accepted");
});

test("loads the official queue once and manually sends one pageview per safe route", () => {
  const consent = readFileSync(new URL("../src/components/analytics/analytics-consent.tsx", import.meta.url), "utf8");
  assert.match(consent, /onReady=\{\(\) => \{ window\.setTimeout\(\(\) => activateTikTokPixel/);
  const base = pixel.tiktokBaseCode();
  assert.match(base, /DBCURCBC77U4J2JQ9R50/);
  assert.match(base, /historyObserver:false/);
  assert.ok(base.indexOf("q.holdConsent()") < base.indexOf("q.load("));
  assert.doesNotMatch(base, /q\.page\(\)/);

  pixel.setMarketingEnabled(true);
  pixel.markTikTokReady();
  assert.equal(calls.filter((call) => call[0] === "page").length, 1);
  assert.equal(calls.filter((call) => call[1] === "ViewContent").length, 1);
  assert.equal(pixel.trackTikTokPageView("/pricing", ""), false);
  assert.equal(calls.filter((call) => call[0] === "page").length, 1);
  assert.equal(calls.filter((call) => call[1] === "ViewContent").length, 1);
  window.location.pathname = "/services";
  assert.equal(pixel.trackTikTokPageView("/services", ""), true);
  assert.equal(calls.filter((call) => call[0] === "page").length, 2);
  window.location.pathname = "/dashboard";
  assert.equal(pixel.trackTikTokPageView("/dashboard", ""), false);
  assert.equal(calls.filter((call) => call[0] === "page").length, 2);
  window.location.pathname = "/services";
  assert.equal(pixel.trackTikTokPageView("/services", ""), true);
  assert.equal(calls.filter((call) => call[0] === "page").length, 3);
  assert.equal(calls.filter((call) => call[1] === "ViewContent").length, 1);
  window.location.pathname = "/pricing";
  assert.equal(pixel.trackTikTokPageView("/pricing", ""), true);
  assert.equal(calls.filter((call) => call[1] === "ViewContent").length, 2);
  assert.equal(pixel.trackTikTokPageView("/pricing", ""), false);
  assert.equal(calls.filter((call) => call[1] === "ViewContent").length, 2);
});

test("cookie preferences stay visible after the first choice; checkout follows successful initialization", () => {
  const consent = readFileSync(new URL("../src/components/analytics/analytics-consent.tsx", import.meta.url), "utf8");
  assert.match(consent, /Cookie preferences<\/button>/);
  assert.match(consent, /!needsChoice && !settingsOpen/);
  const pricing = readFileSync(new URL("../src/components/subscriptions/pricing-client.tsx", import.meta.url), "utf8");
  assert.ok(pricing.indexOf("if (!response.ok) throw") < pricing.indexOf("trackTikTokInitiateCheckout(data.reference)"));
  assert.ok(pricing.indexOf("trackTikTokInitiateCheckout(data.reference)") < pricing.indexOf("window.location.href = data.authorizationUrl"));
  assert.match(pricing, /checkoutInProgress\.current = true/);

  window.location.pathname = "/pricing";
  window.location.search = "";
  assert.equal(pixel.trackTikTokInitiateCheckout("private-checkout-reference"), true);
  assert.equal(pixel.trackTikTokInitiateCheckout("private-checkout-reference"), false);
  assert.equal(calls.filter((call) => call[1] === "InitiateCheckout").length, 1);
  assert.ok(!JSON.stringify(calls).includes("private-checkout-reference"));
});

test("registration follows signup success; verified purchase uses naira, never raw references", () => {
  const signup = readFileSync(new URL("../src/app/auth/signup/page.tsx", import.meta.url), "utf8");
  assert.ok(signup.indexOf("await signup(") < signup.indexOf("trackTikTokRegistration()"));
  const callback = readFileSync(new URL("../src/components/subscriptions/subscription-callback.tsx", import.meta.url), "utf8");
  assert.ok(callback.indexOf("if (!response.ok) throw") < callback.indexOf("trackTikTokPurchase("));
  assert.match(callback, /data\.verifiedPayment\.amountMinor/);
  const server = readFileSync(new URL("../src/lib/subscriptions/server.ts", import.meta.url), "utf8");
  assert.match(server, /verified\.amount !== intent\.amountMinor/);
  assert.match(server, /verifiedPayment: \{ amountMinor: payment\.amountCents, currency: payment\.currency \}/);

  window.location.pathname = "/auth/signup";
  assert.equal(pixel.trackTikTokRegistration(), true);
  assert.equal(calls.filter((call) => call[1] === "CompleteRegistration").length, 1);
  window.location.pathname = "/subscription/callback";
  window.location.search = "?reference=private-reference";
  assert.equal(pixel.trackTikTokPurchase("private-reference", 3500000, "NGN"), true);
  assert.equal(calls.filter((call) => call[1] === "Purchase").length, 0);
  window.location.pathname = "/subscription/confirmed";
  window.location.search = "";
  pixel.trackTikTokPageView("/subscription/confirmed", "");
  const purchases = calls.filter((call) => call[1] === "Purchase");
  assert.equal(purchases.length, 1);
  assert.deepEqual(purchases[0][2], { value: 35000, currency: "NGN" });
  assert.equal(pixel.trackTikTokPurchase("private-reference", 3500000, "NGN"), false);
  assert.equal(pixel.trackTikTokPurchase("another-reference", 3500000, "USD"), false);
  assert.ok(!JSON.stringify(calls).includes("private-reference"));
});

test("withdrawal suppresses further TikTok events", () => {
  const before = calls.filter((call) => call[0] === "track" || call[0] === "page").length;
  pixel.setMarketingEnabled(false);
  assert.equal(calls.at(-1)[0], "revoke");
  assert.equal(pixel.trackTikTokPageView("/pricing", ""), false);
  assert.equal(pixel.trackTikTokRegistration(), false);
  assert.equal(pixel.trackTikTokInitiateCheckout("another-private-reference"), false);
  assert.equal(pixel.trackTikTokPurchase("new-reference", 3500000, "NGN"), false);
  assert.equal(calls.filter((call) => call[0] === "track" || call[0] === "page").length, before);
  window.location.pathname = "/pricing";
  pixel.setMarketingEnabled(true);
  pixel.activateTikTokPixel(() => {});
  assert.equal(calls.filter((call) => call[0] === "page").length, 6);
});
