import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);
const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

function loadModule(path, dependencies, env = {}) {
  const javascript = ts.transpileModule(source(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  runInNewContext(javascript, {
    module,
    exports: module.exports,
    require(specifier) {
      if (Object.hasOwn(dependencies, specifier)) return dependencies[specifier];
      throw new Error(`Unexpected dependency: ${specifier}`);
    },
    process: { env },
    console: { error() {} },
    Date,
    URL,
  }, { filename: path });
  return module.exports;
}

const nextResponse = {
  json(body, options = {}) { return { body, status: options.status ?? 200 }; },
};
const shipment = {
  id: "shipment-1", userId: "owner-1", trackingNumber: "TRK-123456",
  receiver: { name: "Example Recipient", email: "recipient@example.com", city: "Lagos", country: "Nigeria" },
  status: "in_transit", updatedAt: "2026-11-05T09:00:00.000Z",
};
const event = {
  id: "event-1", shipmentId: shipment.id, status: "in_transit",
  location: "Lagos", description: "At sorting hub", timestamp: "2026-11-05T09:00:00.000Z",
};
const request = (recipientEmail = shipment.receiver.email) => ({
  json: async () => ({ trackingNumber: shipment.trackingNumber, recipientEmail, recipientConfirmed: true }),
});

function publicRoute({ found = shipment, configured = true, durable = true, allowed = true } = {}) {
  const sent = [];
  const renderedInputs = [];
  let attempts = 0;
  const route = loadModule("../src/app/api/logistics/track/email/route.ts", {
    "node:crypto": nodeRequire("node:crypto"),
    "next/server": { NextResponse: nextResponse },
    zod: nodeRequire("zod"),
    "@/lib/logistics/email-service": {
      isShipmentEmailConfigured: () => configured,
      submitShipmentEmail: async (notification) => {
        sent.push(notification);
        return { notification: { ...notification, status: "accepted" }, duplicate: false };
      },
    },
    "@/lib/logistics/email-templates": {
      renderShipmentStatusEmail: (input) => { renderedInputs.push(input); return { subject: "Shipment update", html: "<p>Update</p>", text: "Update" }; },
    },
    "@/lib/logistics/store": {
      isLogisticsBackendDurable: durable,
      getShipmentByTrackingNumber: async () => found,
      getTrackingEventsForShipment: async () => [event],
      claimPublicTrackingEmailAttempt: async () => { attempts++; return allowed; },
    },
  });
  return { route, sent, renderedInputs, attempts: () => attempts };
}

test("public tracking email never sends to an address that differs from the stored recipient", async () => {
  const { route, sent, attempts } = publicRoute();
  const response = await route.POST(request("unrelated@example.com"));
  assert.equal(response.status, 202);
  assert.equal(sent.length, 0);
  assert.equal(attempts(), 1);
});

test("matching request sends only to the stored recipient and keeps a stable retry reference", async () => {
  const { route, sent, renderedInputs } = publicRoute();
  const first = await route.POST(request("RECIPIENT@EXAMPLE.COM"));
  const second = await route.POST(request("recipient@example.com"));
  assert.equal(first.status, 202);
  assert.equal(second.status, 202);
  assert.equal(sent.length, 2);
  assert.equal(sent[0].recipientEmail, shipment.receiver.email);
  assert.equal(sent[0].source, "public_tracking");
  assert.equal(sent[0].id, sent[1].id, "the shared service can deduplicate repeated taps");
  assert.equal(renderedInputs[0].shipment.receiver.name, undefined);
  assert.equal(renderedInputs[0].event.notes, undefined);
});

test("public send requires recipient permission confirmation", async () => {
  const { route, sent, attempts } = publicRoute();
  const response = await route.POST({ json: async () => ({ trackingNumber: shipment.trackingNumber, recipientEmail: shipment.receiver.email, recipientConfirmed: false }) });
  assert.equal(response.status, 400);
  assert.equal(sent.length, 0);
  assert.equal(attempts(), 0);
});

test("unknown tracking code has a generic answer and does not create a rate-limit record", async () => {
  const { route, sent, attempts } = publicRoute({ found: null });
  const response = await route.POST(request());
  assert.equal(response.status, 202);
  assert.equal(sent.length, 0);
  assert.equal(attempts(), 0);
});

test("public tracking email fails closed without durable storage or an email sender", async () => {
  for (const options of [{ durable: false }, { configured: false }]) {
    const { route, sent, attempts } = publicRoute(options);
    const response = await route.POST(request());
    assert.equal(response.status, 503);
    assert.equal(sent.length, 0);
    assert.equal(attempts(), 0);
  }
});

test("invalid-address rate limit cannot block the real recipient", async () => {
  const { route, sent, attempts } = publicRoute({ allowed: false });
  const invalid = await route.POST(request("other@example.com"));
  const valid = await route.POST(request());
  assert.equal(invalid.status, 202);
  assert.equal(valid.status, 202);
  assert.equal(sent.length, 1);
  assert.equal(attempts(), 1);
});

class EmailProviderRejectedError extends Error {}

function emailService({ claim, retry = async () => false, existing = null, send, update = async () => {} }) {
  let sendCount = 0;
  let updateCount = 0;
  const service = loadModule("../src/lib/logistics/email-service.ts", {
    "server-only": {},
    "node:crypto": nodeRequire("node:crypto"),
    "@/lib/email/send": {
      EmailProviderRejectedError,
      isEmailConfigured: true,
      sendEmail: async (input) => { sendCount++; return send(input); },
    },
    "@/lib/logistics/email-templates": {
      TRACKNOVA_EMAIL_LOGO_URL: "https://www.eazytool.app/services/logistics/tracknova-email-logo.png",
    },
    "@/lib/logistics/store": {
      claimShipmentEmailSend: claim,
      claimPendingShipmentEmailRetry: retry,
      getShipmentEmailNotification: async () => typeof existing === "function" ? existing() : existing,
      updateShipmentEmailNotification: async (value) => { updateCount++; return update(value); },
    },
  }, { LOGISTICS_EMAIL_FROM: "Tracking <tracking@example.com>" });
  return { service, sendCount: () => sendCount, updateCount: () => updateCount };
}

const notification = {
  id: "logemail_123456789012", userId: shipment.userId, shipmentId: shipment.id,
  eventId: event.id, recipientEmail: shipment.receiver.email, status: "pending",
};
const rendered = { subject: "Shipment update", html: "<p>Update</p>", text: "Update" };

test("shipment email embeds the TrackNova logo while the browser preview keeps the public URL", async () => {
  const logoUrl = "https://www.eazytool.app/services/logistics/tracknova-email-logo.png";
  let sent = null;
  const { service } = emailService({
    claim: async () => "claimed",
    send: async (input) => { sent = input; return { id: "provider-message-1" }; },
  });
  const preview = { ...rendered, html: `<img src="${logoUrl}" alt="TrackNova">` };
  await service.submitShipmentEmail(notification, preview);
  assert.match(preview.html, new RegExp(logoUrl.replaceAll(".", "\\.")));
  assert.match(sent.html, /src="cid:tracknova-email-logo"/);
  assert.equal(sent.attachments.length, 1);
  assert.equal(sent.attachments[0].path, logoUrl);
  assert.equal(sent.attachments[0].contentId, "tracknova-email-logo");
  assert.equal(sent.attachments[0].contentType, "image/png");
});

test("provider acceptance followed by a failed status save remains pending and cannot resend on duplicate", async () => {
  let claimed = false;
  const { service, sendCount } = emailService({
    claim: async () => { if (claimed) return "duplicate"; claimed = true; return "claimed"; },
    existing: notification,
    send: async () => ({ id: "provider-message-1" }),
    update: async () => { throw new Error("Firestore unavailable"); },
  });
  const first = await service.submitShipmentEmail(notification, rendered);
  const second = await service.submitShipmentEmail(notification, rendered);
  assert.equal(first.notification.status, "pending");
  assert.equal(second.duplicate, true);
  assert.equal(sendCount(), 1);
});

test("an uncertain provider response stays pending; an explicit rejection is recorded as failed", async () => {
  const uncertain = emailService({ claim: async () => "claimed", send: async () => { throw new Error("Network timeout"); } });
  const uncertainResult = await uncertain.service.submitShipmentEmail(notification, rendered);
  assert.equal(uncertainResult.notification.status, "pending");
  assert.equal(uncertain.updateCount(), 0);

  let saved = null;
  const rejected = emailService({
    claim: async () => "claimed",
    send: async () => { throw new EmailProviderRejectedError("Invalid sender"); },
    update: async (value) => { saved = value; },
  });
  const rejectedResult = await rejected.service.submitShipmentEmail(notification, rendered);
  assert.equal(rejectedResult.notification.status, "failed");
  assert.equal(saved.status, "failed");
});

test("a pending request can reconcile with the same provider idempotency key", async () => {
  let claimed = false;
  let claimedNotification = null;
  const keys = [];
  let saved = null;
  const { service, sendCount } = emailService({
    claim: async (value) => { if (claimed) return "duplicate"; claimed = true; claimedNotification = value; return "claimed"; },
    retry: async () => true,
    existing: () => claimedNotification,
    send: async (input) => {
      keys.push(input.idempotencyKey);
      if (keys.length === 1) throw new Error("Network timeout");
      return { id: "provider-message-1" };
    },
    update: async (value) => { saved = value; },
  });
  assert.equal((await service.submitShipmentEmail(notification, rendered)).notification.status, "pending");
  const recovered = await service.submitShipmentEmail(notification, rendered);
  assert.equal(recovered.notification.status, "accepted");
  assert.equal(saved.providerMessageId, "provider-message-1");
  assert.deepEqual(keys, [notification.id, notification.id]);
  assert.equal(sendCount(), 2);
});

test("a changed email body cannot retry with the original idempotency key", async () => {
  let claimedNotification = null;
  const { service, sendCount } = emailService({
    claim: async (value) => { if (claimedNotification) return "duplicate"; claimedNotification = value; return "claimed"; },
    existing: () => claimedNotification,
    retry: async () => true,
    send: async () => { throw new Error("Network timeout"); },
  });
  await service.submitShipmentEmail(notification, rendered);
  const result = await service.submitShipmentEmail(notification, { ...rendered, html: "<p>Changed</p>" });
  assert.equal(result.notification.status, "pending");
  assert.equal(sendCount(), 1);
});

test("a reused request reference for a different recipient cannot send", async () => {
  const { service, sendCount } = emailService({
    claim: async () => "duplicate",
    existing: { ...notification, recipientEmail: "different@example.com" },
    send: async () => ({ id: "must-not-send" }),
  });
  await assert.rejects(service.submitShipmentEmail(notification, rendered), /LOGISTICS_EMAIL_REFERENCE_CONFLICT/);
  assert.equal(sendCount(), 0);
});
