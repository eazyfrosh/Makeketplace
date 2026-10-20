import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/auth/destination.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { authDestination } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("sign-in returns users to an internal destination", () => {
  assert.equal(authDestination("?next=%2Fwallet"), "/wallet");
  assert.equal(authDestination("?next=%2Fdomains%3Ftab%3Dmine%23details"), "/domains?tab=mine#details");
  assert.equal(authDestination(""), "/dashboard");
});

test("external and looping destinations are not followed", () => {
  assert.equal(authDestination("?next=https%3A%2F%2Fevil.example"), "/dashboard");
  assert.equal(authDestination("?next=%2F%2Fevil.example"), "/dashboard");
  assert.equal(authDestination("?next=%2F%5Cevil.example"), "/dashboard");
  assert.equal(authDestination("?next=%2Fauth%2Flogin"), "/dashboard");
});
