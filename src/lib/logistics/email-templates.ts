import { STATUS_LABELS, type Shipment, type ShipmentStatus, type TrackingEvent } from "@/lib/logistics/types";

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
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function getShipmentEmailSubject(shipment: Shipment, status: ShipmentStatus) {
  return `${STATUS_LABELS[status]} — shipment ${shipment.trackingNumber}`;
}

export function renderShipmentStatusEmail(input: {
  shipment: Shipment;
  event: TrackingEvent;
  trackingUrl: string;
}) {
  const { shipment, event, trackingUrl } = input;
  const copy = LOGISTICS_EMAIL_STATUS_COPY[event.status];
  const subject = getShipmentEmailSubject(shipment, event.status);
  const safe = {
    recipient: escapeHtml(shipment.receiver.name || "Customer"),
    trackingNumber: escapeHtml(shipment.trackingNumber),
    status: escapeHtml(STATUS_LABELS[event.status]),
    location: escapeHtml(event.location || "Not provided"),
    description: escapeHtml(event.description || copy.message),
    notes: event.notes ? escapeHtml(event.notes) : "",
    estimatedDelivery: escapeHtml(new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(shipment.estimatedDeliveryDate))),
    eventTime: escapeHtml(displayDate(event.timestamp)),
    trackingUrl: escapeHtml(trackingUrl),
  };

  const html = `<!doctype html>
<html><body style="margin:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;color:#0f172a">
  <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(copy.message)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:28px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0">
      <tr><td style="height:7px;background:${copy.color}"></td></tr>
      <tr><td style="padding:30px 30px 16px">
        <div style="font-size:20px;font-weight:800;letter-spacing:-.02em">TrackNova</div>
        <div style="margin-top:28px;color:${copy.color};font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(copy.eyebrow)}</div>
        <h1 style="margin:10px 0 12px;font-size:28px;line-height:1.2;letter-spacing:-.03em">${escapeHtml(copy.heading)}</h1>
        <p style="margin:0;color:#475569;font-size:15px;line-height:1.7">Hello ${safe.recipient}, ${escapeHtml(copy.message)}</p>
      </td></tr>
      <tr><td style="padding:10px 30px 26px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:8px 18px">
          <tr><td style="padding:12px 0;color:#64748b;font-size:13px">Tracking number</td><td align="right" style="padding:12px 0;font-family:ui-monospace,monospace;font-size:13px;font-weight:700">${safe.trackingNumber}</td></tr>
          <tr><td style="padding:12px 0;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px">Status</td><td align="right" style="padding:12px 0;border-top:1px solid #e2e8f0;color:${copy.color};font-size:13px;font-weight:800">${safe.status}</td></tr>
          <tr><td style="padding:12px 0;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px">Location</td><td align="right" style="padding:12px 0;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600">${safe.location}</td></tr>
          <tr><td style="padding:12px 0;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px">Estimated delivery</td><td align="right" style="padding:12px 0;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600">${safe.estimatedDelivery}</td></tr>
        </table>
        <div style="margin-top:18px;padding:16px 18px;border-left:4px solid ${copy.color};background:#f8fafc;border-radius:4px 12px 12px 4px">
          <div style="font-size:14px;font-weight:700">${safe.description}</div>
          <div style="margin-top:5px;color:#64748b;font-size:12px">${safe.eventTime}</div>
          ${safe.notes ? `<div style="margin-top:9px;color:#475569;font-size:13px;line-height:1.6">${safe.notes}</div>` : ""}
        </div>
        <div style="margin-top:24px;text-align:center"><a href="${safe.trackingUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px">View live tracking</a></div>
      </td></tr>
      <tr><td style="border-top:1px solid #e2e8f0;padding:20px 30px;color:#64748b;font-size:12px;line-height:1.6">This is a shipment-status notification sent through EazyTool. Use the tracking number above when contacting support.</td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  const text = `${copy.heading}\n\nHello ${shipment.receiver.name || "Customer"},\n${copy.message}\n\nTracking number: ${shipment.trackingNumber}\nStatus: ${STATUS_LABELS[event.status]}\nLocation: ${event.location || "Not provided"}\nUpdate: ${event.description || copy.message}\nEstimated delivery: ${new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(shipment.estimatedDeliveryDate))}${event.notes ? `\nNotes: ${event.notes}` : ""}\n\nTrack shipment: ${trackingUrl}`;

  return { subject, html, text, copy };
}
