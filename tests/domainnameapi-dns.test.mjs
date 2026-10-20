import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const source = read("../src/lib/domains/dns-records.ts");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { dnsRecordsMatch } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("DNS equality accepts relative and fully qualified names without masking a changed value", () => {
  const requested = { host: "resend._domainkey.tradeflowsample.com", type: "TXT", value: "dkim-value", ttl: 3600 };
  const existing = { host: "resend._domainkey", type: "TXT", value: '"dkim-value"', ttl: 600 };
  assert.equal(dnsRecordsMatch(existing, requested, "tradeflowsample.com"), true);
  assert.equal(dnsRecordsMatch({ ...existing, value: "other-value" }, requested, "tradeflowsample.com"), false);
});

test("MX equality considers priority and normalizes the trailing dot", () => {
  const requested = { host: "eazytool.tradeflowsample.com", type: "MX", value: "feedback-smtp.example.com", priority: 10, ttl: 3600 };
  const existing = { host: "eazytool", type: "MX", value: "10 feedback-smtp.example.com.", ttl: 600 };
  assert.equal(dnsRecordsMatch(existing, requested, "tradeflowsample.com"), true);
  assert.equal(dnsRecordsMatch({ ...existing, value: "20 feedback-smtp.example.com." }, requested, "tradeflowsample.com"), false);
});

test("a duplicate DNS response is reconciled by reading the exact value back", () => {
  const provider = read("../src/lib/domains/domainnameapi-provider.ts");
  assert.match(provider, /Dna\.DomainService:Zone:10001/);
  assert.match(provider, /const confirmed = await this\.getDnsStatus\(domain\)/);
  assert.match(provider, /confirmed\.some\(\(item\) => dnsRecordsMatch\(item, record, domain\)\)/);
  assert.match(provider, /existingSet \? "PUT" : "POST"/);
  assert.match(provider, /unexpected DNS zone response/);
});
