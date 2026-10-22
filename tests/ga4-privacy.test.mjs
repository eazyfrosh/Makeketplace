import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-X7HVGP5ZR2";
const source = readFileSync(new URL("../src/lib/analytics/ga4.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const ga4 = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

const storage = new Map();
globalThis.window = {
  location: { origin: "https://eazytool.app", hostname: "eazytool.app", pathname: "/pricing", search: "?utm_source=instagram&utm_medium=social&email=private@example.com" },
  localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
};
globalThis.document = { referrer: "https://example.com/private?email=private@example.com", cookie: "" };

test("page locations keep only approved UTMs and replace customer-specific route values", () => {
  assert.equal(ga4.safeCampaignFromSearch("?utm_source=instagram&utm_medium=social&email=private@example.com"), "utm_source=instagram&utm_medium=social");
  for (const source of ["snapchat", "facebook", "google"]) {
    assert.equal(ga4.safeCampaignFromSearch(`?utm_source=${source}&utm_medium=cpc`), `utm_source=${source}&utm_medium=cpc`);
  }
  assert.equal(ga4.safeCampaignFromSearch("?utm_source=private@example.com&utm_campaign=personal"), "");
  assert.equal(ga4.safePageLocation("/dashboard/domains/private-example.com", "utm_source=instagram&utm_medium=social"), "https://eazytool.app/dashboard/domains/[item]?utm_source=instagram&utm_medium=social");
  assert.equal(ga4.safePageLocation("/subscription/callback", "reference=secret&email=private@example.com"), "https://eazytool.app/subscription/callback");
});

test("no page view or conversion is queued without consent; conversions are deduplicated", () => {
  ga4.trackPageView("/pricing");
  ga4.trackSubscriptionPurchase("private-payment-reference", "all-access");
  assert.equal(globalThis.window.dataLayer, undefined);

  ga4.setAnalyticsEnabled(true, "utm_source=instagram&utm_medium=social");
  ga4.trackPageView("/pricing", "utm_source=instagram&utm_medium=social");
  ga4.trackSubscriptionPurchase("private-payment-reference", "all-access");
  ga4.trackSubscriptionPurchase("private-payment-reference", "all-access");
  ga4.trackDomainPurchase("private-domain-reference", "com");
  ga4.trackDomainPurchase("private-domain-reference", "com");
  ga4.trackServiceUsage("random-user-input");

  const calls = globalThis.window.dataLayer;
  const consentUpdateIndex = calls.findIndex((call) => call[0] === "consent" && call[1] === "update");
  const configIndex = calls.findIndex((call) => call[0] === "config");
  assert.ok(consentUpdateIndex >= 0 && consentUpdateIndex < configIndex);
  assert.equal(calls[consentUpdateIndex][2].analytics_storage, "granted");
  const config = calls.find((call) => call[0] === "config");
  assert.equal(config[2].send_page_view, false);
  const events = calls.filter((call) => call[0] === "event");
  assert.ok(events.every((call) => call[2].send_to === "G-X7HVGP5ZR2"));
  assert.equal(events.filter((call) => call[1] === "page_view").length, 1);
  assert.equal(events.filter((call) => call[1] === "subscription_purchase").length, 1);
  assert.equal(events.filter((call) => call[1] === "domain_purchase").length, 1);
  assert.equal(events.filter((call) => call[1] === "service_used").length, 0);
  assert.ok(!JSON.stringify(calls).includes("private-payment-reference"));
  assert.ok(!JSON.stringify(calls).includes("private-domain-reference"));
  assert.ok(!JSON.stringify(calls).includes("private@example.com"));

  ga4.setAnalyticsEnabled(false);
  ga4.trackLogin();
  assert.equal(calls.filter((call) => call[0] === "event").length, events.length);
});

test("the consent UI only mounts the tag after permission", () => {
  const consent = readFileSync(new URL("../src/components/analytics/analytics-consent.tsx", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  assert.match(consent, /choice === "accepted" && <Script/);
  assert.match(consent, /choice !== "accepted" \|\| !scriptReady/);
  assert.match(consent, /onReady=\{\(\) => setScriptReady\(true\)\}/);
  assert.match(consent, /lastPageView\.current === routeKey/);
  assert.match(layout, /<head>[\s\S]*id="eazytool-ga4-consent-default"/);
  assert.match(layout, /analytics_storage: 'denied'/);
  assert.match(consent, /Reject analytics/);
  assert.match(consent, /Allow analytics/);
});
