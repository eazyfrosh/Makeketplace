import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/domain-pricing.ts", import.meta.url), "utf8");

test("server-side .com registration and renewal prices use approved integer kobo amounts", () => {
  assert.match(source, /fixedRegistrationPriceMinor:\s*2_400_000/);
  assert.match(source, /fixedRenewalPriceMinor:\s*3_000_000/);
  assert.match(source, /calculateDomainRenewalPrice/);
  assert.ok(!source.includes("process.env.NEXT_PUBLIC"));
});

test("compiled pricing returns ₦24,000 registration and ₦30,000 renewal", async () => {
  const standalone = source.replace(/^import .*$/m, "const COMMON_TLDS = ['.com'];").replace(/: Record<string, DomainPricing>/g, "").replace(/: DomainPricing/g, "").replace(/: string/g, "").replace(/, registrarCostCents =/g, ", registrarCostCents =");
  const { outputText } = ts.transpileModule(standalone, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  const pricing = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
  assert.equal(pricing.calculateDomainPrice(".com"), 2_400_000);
  assert.equal(pricing.calculateDomainRenewalPrice(".com"), 3_000_000);
});
