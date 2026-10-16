import { extrasLineItems } from "@/lib/airline/data/extras-pricing";
import { findAirline } from "@/lib/airline/data/airlines";
import { cabinLabel, formatCurrency, formatDateLong, formatTime } from "@/lib/airline/utils";
import type { Booking } from "@/lib/airline/types";

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

function safeLogoUrl(logoSrc: string, origin: string) {
  if (
    !logoSrc.startsWith("/airline-logos/") &&
    !logoSrc.startsWith("/airlines/") &&
    !logoSrc.startsWith("/api/airline-logo?")
  ) return null;
  return `${origin}${logoSrc}`;
}

interface InlineLogoAttachment {
  path: string;
  filename: string;
  content_id: string;
  content_type: "image/png";
}

function collectInlineLogos(booking: Booking, origin: string) {
  const contentIds = new Map<string, string>();
  const attachments: InlineLogoAttachment[] = [];

  for (const flight of booking.flights) {
    const first = flight.segments[0];
    if (!first) continue;
    const airline = findAirline(first.airline.id) ?? first.airline;
    const path = safeLogoUrl(airline.logoSrc, origin);
    if (!path || contentIds.has(path)) continue;

    const contentId = `airline-logo-${attachments.length + 1}`;
    const safeId = airline.id.replace(/[^a-z0-9_-]/gi, "-") || `logo-${attachments.length + 1}`;
    contentIds.set(path, contentId);
    attachments.push({
      path,
      filename: `${safeId}.png`,
      content_id: contentId,
      content_type: "image/png",
    });
  }

  return { contentIds, attachments };
}

export function itineraryEmailSubject(booking: Booking) {
  return `Your SkyBook itinerary — confirmation ${booking.bookingReference}`;
}

export function renderItineraryEmail(booking: Booking, origin: string) {
  const inlineLogos = collectInlineLogos(booking, origin);
  const passengerName = booking.passengers[0]
    ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}`
    : "Traveler";
  const flightCards = booking.flights.slice(0, 8).map((flight) => {
    const first = flight.segments[0];
    const last = flight.segments[flight.segments.length - 1];
    if (!first || !last) return "";
    const airline = findAirline(first.airline.id) ?? first.airline;
    const logoUrl = safeLogoUrl(airline.logoSrc, origin);
    const contentId = logoUrl ? inlineLogos.contentIds.get(logoUrl) : null;
    const logo = logoUrl
      ? `<img src="${contentId ? `cid:${contentId}` : escapeHtml(logoUrl)}" width="38" height="38" alt="${escapeHtml(airline.name)}" style="display:block;width:38px;height:38px;object-fit:contain;border-radius:9px;background:#fff;border:1px solid #dbeafe;padding:4px;box-sizing:border-box">`
      : `<span style="display:inline-block;width:38px;height:38px;line-height:38px;text-align:center;border-radius:9px;background:#0758b7;color:#fff;font-weight:700;font-size:12px">${escapeHtml(airline.code)}</span>`;
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;border:1px solid #dbeafe;border-radius:14px;border-collapse:separate;background:#ffffff">
        <tr><td style="padding:16px 18px 10px">
          <table role="presentation" width="100%"><tr>
            <td width="48">${logo}</td>
            <td style="font-size:14px;font-weight:700;color:#0f172a">${escapeHtml(airline.name)}<br><span style="font-size:11px;font-weight:500;color:#64748b">${escapeHtml(first.flightNumber)} · ${escapeHtml(first.aircraft)}</span></td>
            <td align="right" style="font-size:11px;font-weight:700;color:#0758b7;text-transform:uppercase">${escapeHtml(cabinLabel(flight.cabin))}</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:8px 18px 18px">
          <table role="presentation" width="100%"><tr>
            <td width="38%"><div style="font-size:24px;font-weight:800;color:#0f172a">${escapeHtml(first.originCode)}</div><div style="font-size:13px;font-weight:700;color:#0758b7">${escapeHtml(formatTime(first.departureTime))}</div><div style="font-size:11px;color:#64748b">${escapeHtml(formatDateLong(first.departureTime))}</div></td>
            <td width="24%" align="center" style="font-size:12px;color:#64748b">✈<div style="margin-top:5px;border-top:1px dashed #93c5fd"></div><div style="margin-top:5px">${flight.stops === 0 ? "Non-stop" : `${flight.stops} stop${flight.stops === 1 ? "" : "s"}`}</div></td>
            <td width="38%" align="right"><div style="font-size:24px;font-weight:800;color:#0f172a">${escapeHtml(last.destinationCode)}</div><div style="font-size:13px;font-weight:700;color:#0758b7">${escapeHtml(formatTime(last.arrivalTime))}</div><div style="font-size:11px;color:#64748b">${escapeHtml(formatDateLong(last.arrivalTime))}</div></td>
          </tr></table>
        </td></tr>
      </table>`;
  }).join("");

  const extras = extrasLineItems(booking.extras).map((item) => `
    <tr><td style="padding:4px 0;color:#475569;font-size:13px">${escapeHtml(item.label)}</td><td align="right" style="padding:4px 0;color:#0f172a;font-size:13px">${item.price ? escapeHtml(formatCurrency(item.price, booking.currency)) : "Included"}</td></tr>`).join("");
  const passengers = booking.passengers.slice(0, 12).map((passenger) =>
    `<div style="padding:4px 0;font-size:13px;color:#475569">${escapeHtml(passenger.firstName)} ${escapeHtml(passenger.lastName)} · ${escapeHtml(passenger.type)}</div>`
  ).join("");

  const html = `<!doctype html><html><body style="margin:0;background:#eff6ff;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eff6ff;padding:24px 10px"><tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #bfdbfe">
        <tr><td style="padding:28px 34px;background:#0758b7;color:#fff">
          <table role="presentation" width="100%"><tr><td><div style="font-size:24px;font-weight:800">✈ SkyBook</div><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#bfdbfe">Travel itinerary</div></td><td align="right"><div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#bfdbfe">Booking reference</div><div style="font-size:20px;font-weight:800;letter-spacing:3px">${escapeHtml(booking.bookingReference)}</div></td></tr></table>
        </td></tr>
        <tr><td style="padding:30px 34px">
          <p style="margin:0;font-size:16px;font-weight:700">Hi ${escapeHtml(booking.passengers[0]?.firstName ?? "traveler")},</p>
          <p style="margin:8px 0 0;color:#475569;font-size:14px;line-height:1.6">Your booking is confirmed. Here are the itinerary details for your trip.</p>
          <div style="margin-top:20px;padding:14px 16px;border-radius:12px;background:#eff6ff;border-left:4px solid #0758b7"><span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b">Booking status</span><div style="margin-top:3px;font-weight:800;color:#0758b7;text-transform:capitalize">${escapeHtml(booking.status.replace(/_/g, " "))}</div></div>
          <div style="margin-top:24px;font-size:11px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:#0758b7">Flight information</div>
          ${flightCards}
          <table role="presentation" width="100%" style="margin-top:24px"><tr><td valign="top" width="50%"><div style="font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#0758b7">Passengers</div><div style="margin-top:8px">${passengers}</div>${booking.seatAssignment ? `<div style="margin-top:6px;font-size:13px;color:#475569">Seat: <strong>${escapeHtml(booking.seatAssignment)}</strong></div>` : ""}</td><td valign="top" width="50%"><div style="font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#0758b7">Extras</div><table role="presentation" width="100%" style="margin-top:4px">${extras || '<tr><td style="padding:4px 0;color:#64748b;font-size:13px">No extras selected</td></tr>'}</table></td></tr></table>
          <table role="presentation" width="100%" style="margin-top:22px;border-top:2px solid #0f172a"><tr><td style="padding-top:12px;font-size:15px;font-weight:800">Total</td><td align="right" style="padding-top:12px;font-size:18px;font-weight:800;color:#0758b7">${escapeHtml(formatCurrency(booking.totalPrice, booking.currency))}</td></tr></table>
          <p style="margin:26px 0 0;text-align:center;color:#64748b;font-size:12px;line-height:1.6">Safe travels, ${escapeHtml(passengerName)}.<br>The SkyBook team</p>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#dbeafe;text-align:center;font-size:11px;color:#475569">SkyBook · Booking confirmation · <a href="${escapeHtml(origin)}" style="color:#0758b7">skybookinc.app</a></td></tr>
      </table>
    </td></tr></table>
  </body></html>`;

  const text = [
    `SkyBook booking confirmation ${booking.bookingReference}`,
    `Hi ${booking.passengers[0]?.firstName ?? "traveler"}, your booking is ${booking.status.replace(/_/g, " ")}.`,
    ...booking.flights.map((flight) => {
      const first = flight.segments[0];
      const last = flight.segments[flight.segments.length - 1];
      return first && last ? `${first.airline.name} ${first.flightNumber}: ${first.originCode} to ${last.destinationCode}, ${formatDateLong(first.departureTime)} at ${formatTime(first.departureTime)}` : "";
    }).filter(Boolean),
    `Total: ${formatCurrency(booking.totalPrice, booking.currency)}`,
    "Safe travels! — The SkyBook team",
  ].join("\n\n");

  return { html, text, attachments: inlineLogos.attachments };
}
