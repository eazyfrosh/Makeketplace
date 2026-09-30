import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const templates = readFileSync(new URL("../src/lib/logistics/email-templates.ts", import.meta.url), "utf8");
const route = readFileSync(new URL("../src/app/api/logistics/shipments/[id]/email/route.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/logistics/store.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/platform/logistics-platform/shipments/[id]/page.tsx", import.meta.url), "utf8");

const statuses = ["pending", "processing", "picked_up", "in_transit", "arrived_at_hub", "customs_clearance", "out_for_delivery", "delivered", "failed_delivery", "returned", "cancelled"];

test("every shipment status has a dedicated email template", () => {
  for (const status of statuses) assert.match(templates, new RegExp(`\\b${status}: \\{`));
  assert.match(templates, /escapeHtml/);
  assert.match(templates, /View live tracking/);
  assert.match(templates, /text = `/);
});

test("shipment email API authenticates and enforces shipment ownership", () => {
  assert.match(route, /verifyCaller\(request\)/);
  assert.match(route, /shipment\.userId !== caller\.uid/);
  assert.match(route, /recipientConfirmed: z\.literal\(true\)/);
  assert.match(route, /isEmailConfigured/);
});

test("shipment emails are idempotent, rate limited and server recorded", () => {
  assert.match(route, /requestId/);
  assert.match(route, /claimShipmentEmailSend/);
  assert.match(route, /idempotencyKey: notification\.id/);
  assert.match(store, /LOGISTICS_EMAIL_RATE_LIMIT/);
  assert.match(store, /runTransaction/);
});

test("shipment page provides recipient, event selection, consent and preview", () => {
  assert.match(page, /Recipient email/);
  assert.match(page, /Tracking update/);
  assert.match(page, /recipient is connected to the shipment/);
  assert.match(page, /Email preview/);
  assert.match(page, /Send status email/);
});
