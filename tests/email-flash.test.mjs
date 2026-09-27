import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

async function importTs(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

const { renderReceiptEmail } = await importTs("../src/lib/receipt-email/render.ts");
const template = {
  logoUrl: "",
  merchantName: "Acme & Sons",
  merchantEmail: "hello@acme.test",
  merchantPhone: "",
  merchantAddress: "Lagos",
  primaryColor: "#2563EB",
  backgroundColor: "#F1F5F9",
  textColor: "#0F172A",
  message: "Thanks <script>alert(1)</script>",
  footer: "Saved for your records",
};
const transaction = {
  reference: "EZT-REAL-123",
  occurredAt: "2026-09-27T10:00:00.000Z",
  amountMinor: 2500000,
  currency: "NGN",
  lineItems: [{ description: "Platform subscription", quantity: 1, unitAmountMinor: 2500000 }],
};

test("rendered receipt includes the authoritative transaction reference and total", () => {
  const html = renderReceiptEmail({ template, transaction, customerName: "Ada" });
  assert.match(html, /EZT-REAL-123/);
  assert.match(html, /25,000/);
  assert.match(html, /Verified EazyTools transaction/);
});

test("receipt content is HTML escaped", () => {
  const html = renderReceiptEmail({ template, transaction, customerName: "<img src=x>" });
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(!html.includes("<img src=x>"));
  assert.match(html, /&lt;script&gt;/);
});

test("Email Flash rejects browser-controlled transactions and uses server authorization", () => {
  const sendRoute = readFileSync(new URL("../src/app/api/email-flash/send/route.ts", import.meta.url), "utf8");
  for (const marker of ["verifyCaller", "requireReceiptEmailAccess", "getReceiptTransaction(caller.uid", "consumeReceiptEmailRateLimit", "requestId"]) assert.ok(sendRoute.includes(marker), marker);
  assert.ok(!sendRoute.includes("input.amount"));
  assert.ok(!sendRoute.includes("input.reference"));
});

test("delivery webhook verifies its provider signature", () => {
  const webhook = readFileSync(new URL("../src/app/api/email-flash/webhook/route.ts", import.meta.url), "utf8");
  assert.ok(webhook.includes("verifyResendWebhook"));
  assert.ok(webhook.includes("Invalid webhook signature"));
});

test("Firestore blocks direct client access to all Email Flash collections", () => {
  const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
  for (const collection of ["receiptEmailTemplates", "receiptEmailSends", "receiptEmailAuditLogs", "receiptEmailRateLimits"]) {
    assert.match(rules, new RegExp(`match /${collection}\\/\\{[^}]+\\} \\{ allow read, write: if false; \\}`));
  }
});
