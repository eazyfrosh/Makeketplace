import { STATUS_LABELS, type ShipmentStatus, type TrackingEvent } from "@/lib/logistics/types";

type EmailShipment = { trackingNumber: string; estimatedDeliveryDate: string; receiver: { name?: string } };
type EmailEvent = Pick<TrackingEvent, "status" | "location" | "description" | "timestamp" | "notes">;
export const TRACKNOVA_EMAIL_LOGO_URL = "https://www.eazytool.app/services/logistics/tracknova-email-logo.png";

interface StatusCopy {
  eyebrow: string;
  heading: string;
  message: string;
  color: string;
}

export const LOGISTICS_EMAIL_STATUS_COPY: Record<ShipmentStatus, StatusCopy> = {
  pending: { eyebrow: "Shipment created", heading: "Your shipment is ready for processing", message: "We have received the shipment details and will share another update when processing begins.", color: "#64748b" },
  processing: { eyebrow: "Processing", heading: "Your shipment is being prepared", message: "The shipment is being prepared for pickup and movement through the delivery network.", color: "#7c3aed" },
  picked_up: { eyebrow: "Picked up", heading: "Your package has been collected", message: "The carrier has collected the package and it is now moving to the next facility.", color: "#2563eb" },
  in_transit: { eyebrow: "In transit", heading: "Your package is on the way", message: "The shipment is moving through the carrier network toward its destination.", color: "#0284c7" },
  arrived_at_hub: { eyebrow: "Hub update", heading: "Your package arrived at a carrier hub", message: "The shipment reached a carrier facility and is being prepared for its next movement.", color: "#0891b2" },
  customs_clearance: { eyebrow: "Customs update", heading: "Your shipment is in customs clearance", message: "The shipment is undergoing the standard customs review process. We will share another update when it is released.", color: "#d97706" },
  out_for_delivery: { eyebrow: "Out for delivery", heading: "Your package is arriving soon", message: "The shipment is with the local delivery team and is scheduled for delivery.", color: "#ea580c" },
  delivered: { eyebrow: "Delivered", heading: "Your package has been delivered", message: "The carrier has marked this shipment as delivered.", color: "#16a34a" },
  failed_delivery: { eyebrow: "Delivery update", heading: "The delivery attempt was unsuccessful", message: "The carrier could not complete delivery. Review the tracking details or contact support for the next step.", color: "#dc2626" },
  returned: { eyebrow: "Return update", heading: "Your shipment is being returned", message: "The carrier has marked the shipment for return. Review the tracking details for the latest location.", color: "#be123c" },
  cancelled: { eyebrow: "Shipment cancelled", heading: "This shipment has been cancelled", message: "The shipment is no longer scheduled for delivery.", color: "#475569" },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function displayDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? `${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date)} UTC` : "To be confirmed";
}

function displayEstimatedDelivery(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(date) : "To be confirmed";
}

export function getShipmentEmailSubject(shipment: EmailShipment, status: ShipmentStatus) {
  return `${STATUS_LABELS[status] ?? "Shipment update"} — shipment ${shipment.trackingNumber}`;
}

export function renderShipmentStatusEmail(input: {
  shipment: EmailShipment;
  event: EmailEvent;
  trackingUrl: string;
}) {
  const { shipment, event, trackingUrl } = input;
  const copy = LOGISTICS_EMAIL_STATUS_COPY[event.status] ?? LOGISTICS_EMAIL_STATUS_COPY.pending;
  const subject = getShipmentEmailSubject(shipment, event.status);
  const safe = {
    recipient: escapeHtml(shipment.receiver.name || "Customer"),
    trackingNumber: escapeHtml(shipment.trackingNumber),
    status: escapeHtml(STATUS_LABELS[event.status] ?? "Shipment update"),
    location: escapeHtml(event.location || "Not provided"),
    description: escapeHtml(event.description || copy.message),
    notes: event.notes ? escapeHtml(event.notes) : "",
    estimatedDelivery: escapeHtml(displayEstimatedDelivery(shipment.estimatedDeliveryDate)),
    eventTime: escapeHtml(displayDate(event.timestamp)),
    trackingUrl: escapeHtml(trackingUrl),
  };

  const html = `<!doctype html>
<html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#edf4ff;font-family:Arial,Helvetica,sans-serif;color:#10254a">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(copy.message)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#edf4ff"><tr><td align="center" style="padding:28px 12px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #d8e6fa;border-radius:16px;overflow:hidden">
      <tr><td style="padding:14px 28px 12px;background:#ffffff;border-bottom:1px solid #e5edfa">
        <img src="${TRACKNOVA_EMAIL_LOGO_URL}" width="260" alt="TrackNova" style="display:block;width:260px;max-width:100%;height:auto;border:0" />
      </td></tr>
      <tr><td style="padding:28px;background:#082b67;color:#ffffff">
        <div style="color:#a8d8ff;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Shipment update</div>
        <h1 style="margin:10px 0 12px;color:#ffffff;font-size:26px;line-height:1.25;font-weight:700">${escapeHtml(copy.heading)}</h1>
        <div style="color:#e1efff;font-size:14px;line-height:1.5">Tracking number: <strong style="color:#ffffff">${safe.trackingNumber}</strong></div>
      </td></tr>
      <tr><td style="padding:28px 28px 12px">
        <p style="margin:0;color:#263b5e;font-size:15px;line-height:1.7">Hello ${safe.recipient},</p>
        <p style="margin:12px 0 0;color:#263b5e;font-size:15px;line-height:1.7">${escapeHtml(copy.message)}</p>
      </td></tr>
      <tr><td style="padding:8px 28px 26px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f8ff;border:1px solid #d9e9ff;border-radius:12px">
          <tr><td colspan="2" style="padding:16px 18px 12px;border-left:4px solid ${copy.color}">
            <div style="color:#28538c;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Current status</div>
            <div style="margin-top:5px;color:#082b67;font-size:18px;font-weight:700">${safe.status}</div>
          </td></tr>
          <tr><td style="padding:12px 8px 12px 18px;border-top:1px solid #d9e9ff;color:#526987;font-size:13px">Location</td><td align="right" style="padding:12px 18px 12px 8px;border-top:1px solid #d9e9ff;color:#10254a;font-size:13px;font-weight:700;overflow-wrap:anywhere">${safe.location}</td></tr>
          <tr><td style="padding:12px 8px 12px 18px;border-top:1px solid #d9e9ff;color:#526987;font-size:13px">Estimated delivery</td><td align="right" style="padding:12px 18px 12px 8px;border-top:1px solid #d9e9ff;color:#10254a;font-size:13px;font-weight:700">${safe.estimatedDelivery}</td></tr>
        </table>
        <div style="padding:20px 0 0">
          <div style="color:#28538c;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Latest update</div>
          <p style="margin:8px 0 0;color:#10254a;font-size:14px;font-weight:700;line-height:1.6">${safe.description}</p>
          <p style="margin:5px 0 0;color:#526987;font-size:12px;line-height:1.5">${safe.eventTime}</p>
          ${safe.notes ? `<p style="margin:12px 0 0;color:#526987;font-size:13px;line-height:1.6">${safe.notes}</p>` : ""}
        </div>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:24px"><tr><td style="background:#0866e8;border-radius:9px"><a href="${safe.trackingUrl}" style="display:inline-block;padding:14px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700">View live tracking</a></td></tr></table>
      </td></tr>
      <tr><td style="padding:18px 28px;background:#f3f8ff;border-top:1px solid #d9e9ff;color:#526987;font-size:12px;line-height:1.6">TrackNova shipment update sent through EazyTool. Keep your tracking number for support enquiries.</td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  const text = `${copy.heading}\n\nHello ${shipment.receiver.name || "Customer"},\n${copy.message}\n\nTracking number: ${shipment.trackingNumber}\nStatus: ${STATUS_LABELS[event.status] ?? "Shipment update"}\nLocation: ${event.location || "Not provided"}\nUpdate: ${event.description || copy.message}\nEstimated delivery: ${displayEstimatedDelivery(shipment.estimatedDeliveryDate)}${event.notes ? `\nNotes: ${event.notes}` : ""}\n\nTrack shipment: ${trackingUrl}`;

  return { subject, html, text, copy };
}
