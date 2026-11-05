import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const templates = readFileSync(new URL("../src/lib/logistics/email-templates.ts", import.meta.url), "utf8");
const route = readFileSync(new URL("../src/app/api/logistics/shipments/[id]/email/route.ts", import.meta.url), "utf8");
const service = readFileSync(new URL("../src/lib/logistics/email-service.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/logistics/store.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/platform/logistics-platform/shipments/[id]/page.tsx", import.meta.url), "utf8");
const publicPage = readFileSync(new URL("../src/app/track-shipment/[trackingNumber]/page.tsx", import.meta.url), "utf8");
const publicRoute = readFileSync(new URL("../src/app/api/logistics/track/email/route.ts", import.meta.url), "utf8");

const statuses = ["pending", "processing", "picked_up", "in_transit", "arrived_at_hub", "customs_clearance", "out_for_delivery", "delivered", "failed_delivery", "returned", "cancelled"];

test("every shipment status has a dedicated email template", () => {
  for (const status of statuses) assert.match(templates, new RegExp(`\\b${status}: \\{`));
  assert.match(templates, /escapeHtml/);
  assert.match(templates, /View live tracking/);
  assert.match(templates, /text = `/);
});

test("the shipment email preview renders valid dates and legacy statuses without throwing", () => {
  const javascript = ts.transpileModule(templates, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  runInNewContext(javascript, {
    module,
    exports: module.exports,
    require: () => ({ STATUS_LABELS: Object.fromEntries(statuses.map((status) => [status, status.replaceAll("_", " ")])) }),
    Intl,
    Date,
  });
  const rendered = module.exports.renderShipmentStatusEmail({
    shipment: { trackingNumber: "DEMO-123", estimatedDeliveryDate: "2026-11-10T12:00:00.000Z", receiver: {} },
    event: { status: "in_transit", location: "Lagos", description: "In transit", timestamp: "2026-11-05T12:00:00.000Z" },
    trackingUrl: "https://eazytool.app/track-shipment/DEMO-123",
  });
  assert.match(rendered.html, /UTC/);
  assert.match(rendered.html, /DEMO-123/);
  assert.match(rendered.html, /https:\/\/www\.eazytool\.app\/services\/logistics\/tracknova-email-logo\.png/);
  assert.match(rendered.html, /alt="TrackNova"/);
  assert.deepEqual([...readFileSync(new URL("../public/services/logistics/tracknova-email-logo.png", import.meta.url)).subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.match(rendered.text, /In transit/);
  const legacy = module.exports.renderShipmentStatusEmail({
    shipment: { trackingNumber: "DEMO-123", estimatedDeliveryDate: "", receiver: {} },
    event: { status: "legacy_status", location: "", description: "", timestamp: "" },
    trackingUrl: "https://eazytool.app/track-shipment/DEMO-123",
  });
  assert.match(legacy.html, /Shipment update/);
  assert.match(legacy.html, /To be confirmed/);
});

test("shipment email API authenticates and enforces shipment ownership", () => {
  assert.match(route, /verifyCaller\(request\)/);
  assert.match(route, /shipment\.userId !== caller\.uid/);
  assert.match(route, /recipientConfirmed: z\.literal\(true\)/);
  assert.match(route, /isShipmentEmailConfigured/);
  assert.match(route, /isLogisticsBackendDurable/);
});

test("shipment emails are idempotent, rate limited and server recorded", () => {
  assert.match(route, /requestId/);
  assert.match(route, /submitShipmentEmail/);
  assert.match(service, /claimShipmentEmailSend/);
  assert.match(service, /idempotencyKey: current\.id/);
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

test("public email preview uses the same safe renderer and only the stored receiver can receive it", () => {
  assert.match(publicPage, /renderShipmentStatusEmail/);
  assert.match(publicPage, /Tracking details email preview/);
  assert.match(publicRoute, /renderShipmentStatusEmail/);
  assert.match(publicRoute, /sameEmail\(recipientEmail, shipment\.receiver\.email\)/);
  assert.match(publicRoute, /recipientEmail: shipment\.receiver\.email\.trim\(\)\.toLowerCase\(\)/);
});
