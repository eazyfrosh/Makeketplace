import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

function compile(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

const typesUrl = `data:text/javascript;base64,${Buffer.from(compile("../src/lib/sms/types.ts")).toString("base64")}`;
const coreSource = compile("../src/lib/sms/core.ts").replace('from "./types"', `from "${typesUrl}"`);
const coreUrl = `data:text/javascript;base64,${Buffer.from(coreSource).toString("base64")}`;
const { SMS_COUNTRIES, normalizePhone } = await import(coreUrl);

test("SMS selector and server share a broad list with unique country codes", () => {
  assert.ok(SMS_COUNTRIES.length >= 50);
  assert.equal(new Set(SMS_COUNTRIES.map((country) => country.code)).size, SMS_COUNTRIES.length);
  for (const code of ["US", "GB", "CA", "AU", "DE", "FR", "ES", "IT", "NL", "IE", "NZ", "GH", "KE", "ZA", "AE", "IN", "SG", "BR"]) {
    assert.ok(SMS_COUNTRIES.some((country) => country.code === code), code);
  }
  assert.ok(!SMS_COUNTRIES.some((country) => country.code === "NG"));
});

test("SMS numbers normalize to the selected country's calling code", () => {
  assert.equal(normalizePhone("GH", "024 123 4567"), "+233241234567");
  assert.equal(normalizePhone("AE", "+971 50 123 4567"), "+971501234567");
  assert.throws(() => normalizePhone("GH", "+14155552671"), /Ghana/);
  assert.throws(() => normalizePhone("US", "+442071838750"), /United States/);
  assert.throws(() => normalizePhone("NG", "08012345678"), /supported country/);
});
