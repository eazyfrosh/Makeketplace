import "server-only";
import { createHash } from "node:crypto";

import { EmailProviderRejectedError, isEmailConfigured, sendEmail } from "@/lib/email/send";
import {
  claimPendingShipmentEmailRetry,
  claimShipmentEmailSend,
  getShipmentEmailNotification,
  updateShipmentEmailNotification,
} from "@/lib/logistics/store";
import type { ShipmentEmailNotification } from "@/lib/logistics/types";
import { TRACKNOVA_EMAIL_LOGO_URL, type renderShipmentStatusEmail } from "@/lib/logistics/email-templates";

const TRACKNOVA_EMAIL_LOGO_CID = "tracknova-email-logo";

export function prepareShipmentEmailForDelivery(html: string) {
  if (!html.includes(TRACKNOVA_EMAIL_LOGO_URL)) return { html, attachments: [] };
  return {
    html: html.replaceAll(TRACKNOVA_EMAIL_LOGO_URL, `cid:${TRACKNOVA_EMAIL_LOGO_CID}`),
    attachments: [{
      path: TRACKNOVA_EMAIL_LOGO_URL,
      filename: "tracknova-logo.png",
      contentId: TRACKNOVA_EMAIL_LOGO_CID,
      contentType: "image/png",
    }],
  };
}

export function shipmentEmailSender() {
  return process.env.LOGISTICS_EMAIL_FROM?.trim() || process.env.EMAIL_FROM?.trim() || null;
}

export function isShipmentEmailConfigured() {
  return isEmailConfigured && Boolean(shipmentEmailSender());
}

type RenderedEmail = ReturnType<typeof renderShipmentStatusEmail>;

export async function submitShipmentEmail(
  notification: ShipmentEmailNotification,
  rendered: RenderedEmail,
  options?: { limitKey?: string; maximum?: number },
): Promise<{ notification: ShipmentEmailNotification; duplicate: boolean }> {
  const from = shipmentEmailSender();
  const delivery = prepareShipmentEmailForDelivery(rendered.html);
  const payloadFingerprint = createHash("sha256")
    .update(JSON.stringify({ from, to: notification.recipientEmail, subject: rendered.subject, html: delivery.html, text: rendered.text, attachments: delivery.attachments }))
    .digest("hex");
  const prepared = { ...notification, payloadFingerprint };
  const claim = await claimShipmentEmailSend(prepared, options);
  let current: ShipmentEmailNotification = prepared;
  const duplicate = claim === "duplicate";
  if (claim === "duplicate") {
    const existing = await getShipmentEmailNotification(notification.id);
    if (!existing || existing.userId !== notification.userId || existing.shipmentId !== notification.shipmentId ||
      existing.recipientEmail !== notification.recipientEmail || existing.eventId !== notification.eventId) {
      throw new Error("LOGISTICS_EMAIL_REFERENCE_CONFLICT");
    }
    // Resend requires the same payload for a repeated idempotency key. If the
    // shipment changed, leave the original request pending for reconciliation.
    if (existing.status !== "pending" || existing.payloadFingerprint !== payloadFingerprint ||
      !await claimPendingShipmentEmailRetry(existing.id)) {
      return { notification: existing, duplicate: true };
    }
    current = existing;
  }

  let result: Awaited<ReturnType<typeof sendEmail>>;
  try {
    result = await sendEmail({
      to: current.recipientEmail,
      subject: rendered.subject,
      html: delivery.html,
      text: rendered.text,
      attachments: delivery.attachments,
      idempotencyKey: current.id,
      from: from ?? undefined,
    });
  } catch (error) {
    if (error instanceof EmailProviderRejectedError && !duplicate) {
      const failed: ShipmentEmailNotification = {
        ...current, status: "failed", errorMessage: "The email provider could not accept this message.", updatedAt: new Date().toISOString(),
      };
      await updateShipmentEmailNotification(failed).catch(() => undefined);
      return { notification: failed, duplicate: false };
    }
    // A timeout can happen after the provider accepted a request. Keep the
    // idempotency claim pending instead of inviting an unsafe second send.
    console.error("[logistics-email] provider outcome uncertain", { notificationId: current.id, reason: error instanceof Error ? error.name : "unknown" });
    return { notification: current, duplicate };
  }

  const accepted: ShipmentEmailNotification = {
    ...current, providerMessageId: result.id, status: "accepted", updatedAt: new Date().toISOString(),
  };
  try {
    await updateShipmentEmailNotification(accepted);
    return { notification: accepted, duplicate };
  } catch (error) {
    // Resend accepted the email. A failed status write must not trigger a
    // second delivery or mark the accepted message as rejected.
    console.error("[logistics-email] accepted status could not be saved", { notificationId: current.id, reason: error instanceof Error ? error.name : "unknown" });
    return { notification: current, duplicate };
  }
}
