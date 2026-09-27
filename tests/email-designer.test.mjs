import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

async function importTs(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

const { renderReceiptEmail, isStatusOrPaymentTemplate } = await importTs("../src/lib/receipt-email/render.ts");
const design = {
  category: "announcement",
  senderName: "Acme Team",
  senderEmail: "hello@acme.test",
  brandName: "Acme & Sons",
  logoUrl: "",
  subject: "Company update",
  statusLabel: "Announcement",
  heading: "A useful update",
  paragraphs: ["Thanks <script>alert(1)</script>"],
  backgroundColor: "#050505",
  cardColor: "#050505",
  textColor: "#F8F8F8",
  mutedColor: "#A3A3A3",
  accentColor: "#E76521",
  panelColor: "#713006",
  panelTextColor: "#FFFFFF",
  featuredImageUrl: "",
  panelHeading: "BIG NEWS",
  panelBody: "Read the latest update.",
  buttonEnabled: true,
  buttonText: "Learn more",
  buttonUrl: "https://acme.test/update",
  footer: "Thank you.",
};

test("general email design renders customizable brand, heading, panel, button and sender", () => {
  const html = renderReceiptEmail(design);
  for (const marker of ["Acme &amp; Sons", "A useful update", "BIG NEWS", "Learn more", "hello@acme.test"]) assert.match(html, new RegExp(marker));
});

test("email content is escaped", () => {
  const html = renderReceiptEmail(design);
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.match(html, /&lt;script&gt;/);
});

test("status and payment-like messages are visibly unverified and not proof of payment", () => {
  const statusDesign = { ...design, category: "status-notice", subject: "Payment processing", heading: "Processing transaction" };
  assert.equal(isStatusOrPaymentTemplate(statusDesign), true);
  const html = renderReceiptEmail(statusDesign);
  assert.match(html, /UNVERIFIED/);
  assert.match(html, /NOT PROOF OF PAYMENT/);
});

test("server forces tests to the signed-in email and requires consent for other recipients", () => {
  const route = readFileSync(new URL("../src/app/api/email-flash/send/route.ts", import.meta.url), "utf8");
  for (const marker of ["verifyCaller", "requireReceiptEmailAccess", "caller.email", "recipientConsentConfirmed", "consumeReceiptEmailRateLimit", "requestId"]) assert.ok(route.includes(marker), marker);
  assert.ok(!route.includes("getReceiptTransaction"));
  assert.ok(!route.includes("transactionId"));
});

test("delivery webhook verifies its provider signature", () => {
  const webhook = readFileSync(new URL("../src/app/api/email-flash/webhook/route.ts", import.meta.url), "utf8");
  assert.ok(webhook.includes("verifyResendWebhook"));
  assert.ok(webhook.includes("Invalid webhook signature"));
});

test("Firestore blocks direct client access to Email Designer records", () => {
  const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
  for (const collection of ["emailDesignerTemplates", "emailDesignerSends", "emailDesignerAuditLogs", "emailDesignerRateLimits"]) assert.match(rules, new RegExp(`match /${collection}\\/\\{[^}]+\\} \\{ allow read, write: if false; \\}`));
});
