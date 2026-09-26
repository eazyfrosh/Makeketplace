import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Module } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

const filename = resolve("src/lib/airline/verification-url.ts");
const source = readFileSync(filename, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const verificationModule = new Module(filename);
verificationModule.filename = filename;
verificationModule._compile(compiled, filename);
const { getFlightbookOrigin, getVerificationUrl } = verificationModule.exports;

test("airline QR links use the public SkyBook deployment by default", () => {
  const previous = process.env.NEXT_PUBLIC_FLIGHTBOOK_ORIGIN;
  delete process.env.NEXT_PUBLIC_FLIGHTBOOK_ORIGIN;
  try {
    const value = getVerificationUrl(" ez-123 ", "secure token");
    assert.equal(
      value,
      "https://flightbook.vercel.app/verify/EZ-123?token=secure+token",
    );
    assert.equal(value.includes("makeketplace.vercel.app"), false);
    assert.equal(value.includes("verify-boarding-pass"), false);
  } finally {
    if (previous === undefined)
      delete process.env.NEXT_PUBLIC_FLIGHTBOOK_ORIGIN;
    else process.env.NEXT_PUBLIC_FLIGHTBOOK_ORIGIN = previous;
  }
});

test("a configured SkyBook custom domain is normalized to its origin", () => {
  const previous = process.env.NEXT_PUBLIC_FLIGHTBOOK_ORIGIN;
  process.env.NEXT_PUBLIC_FLIGHTBOOK_ORIGIN =
    "https://skybook.example.com/path";
  try {
    assert.equal(getFlightbookOrigin(), "https://skybook.example.com");
    assert.equal(
      getVerificationUrl("ABC123", "token-value"),
      "https://skybook.example.com/verify/ABC123?token=token-value",
    );
  } finally {
    if (previous === undefined)
      delete process.env.NEXT_PUBLIC_FLIGHTBOOK_ORIGIN;
    else process.env.NEXT_PUBLIC_FLIGHTBOOK_ORIGIN = previous;
  }
});

test("unsafe or invalid origins fall back to the public SkyBook deployment", () => {
  const previous = process.env.NEXT_PUBLIC_FLIGHTBOOK_ORIGIN;
  try {
    for (const value of ["javascript:alert(1)", "not a URL"]) {
      process.env.NEXT_PUBLIC_FLIGHTBOOK_ORIGIN = value;
      assert.equal(getFlightbookOrigin(), "https://flightbook.vercel.app");
    }
  } finally {
    if (previous === undefined)
      delete process.env.NEXT_PUBLIC_FLIGHTBOOK_ORIGIN;
    else process.env.NEXT_PUBLIC_FLIGHTBOOK_ORIGIN = previous;
  }
});
