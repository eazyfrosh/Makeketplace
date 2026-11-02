import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

async function importTypeScript(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
}

const { DEFAULT_SUBSCRIPTION_PLANS, planPriceMinor } = await importTypeScript("../src/lib/subscriptions/plans.ts");
const { paidPeriodExpiry } = await importTypeScript("../src/lib/subscriptions/billing-period.ts");

test("All Access lists ₦35,000 monthly and ₦200,000 yearly in Paystack minor units", () => {
  const plan = DEFAULT_SUBSCRIPTION_PLANS.find((item) => item.id === "all-access");
  assert.equal(plan?.monthlyPriceCents, 3_500_000);
  assert.equal(plan?.yearlyPriceCents, 20_000_000);
  assert.equal(planPriceMinor(plan, "monthly"), 3_500_000);
  assert.equal(planPriceMinor(plan, "yearly"), 20_000_000);
});

test("a verified yearly payment grants a full calendar year", () => {
  assert.equal(paidPeriodExpiry("2026-11-02T12:00:00.000Z", null, "yearly"), "2027-11-02T12:00:00.000Z");
  assert.equal(paidPeriodExpiry("2024-02-29T12:00:00.000Z", null, "yearly"), "2025-02-28T12:00:00.000Z");
});

test("an early payment extends from the existing expiry", () => {
  assert.equal(paidPeriodExpiry("2026-11-02T12:00:00.000Z", "2027-01-02T12:00:00.000Z", "yearly"), "2028-01-02T12:00:00.000Z");
});

test("monthly access remains one calendar month at month end", () => {
  assert.equal(paidPeriodExpiry("2026-01-31T12:00:00.000Z", null, "monthly"), "2026-02-28T12:00:00.000Z");
});
