import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { getVerificationUrl } from "@/lib/airline/verification-url";
import { bookingStatusLabel } from "@/lib/airline/data/booking-status";
import { extrasLineItems } from "@/lib/airline/data/extras-pricing";
import { findAirline } from "@/lib/airline/data/airlines";
import { cabinLabel, formatCurrency, formatDateLong, formatDuration, formatTime } from "@/lib/airline/utils";
import type { Airline, Booking } from "@/lib/airline/types";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 14;
const MARGIN_TOP = 12;
const MARGIN_BOTTOM = 12;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const TEXT = [15, 23, 42] as const;
const MUTED = [107, 114, 128] as const;
const LIGHT = [209, 213, 219] as const;

function colorTuple(hex: string): [number, number, number] {
  const value = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  return [Number.parseInt(value.slice(0, 2), 16), Number.parseInt(value.slice(2, 4), 16), Number.parseInt(value.slice(4, 6), 16)];
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function loadAirlineLogo(airline: Airline) {
  const current = findAirline(airline.id) ?? airline;
  if (!current.logoSrc) return null;
  try {
    const response = await fetch(current.logoSrc, { credentials: "same-origin" });
    if (!response.ok) return null;
    return await readBlobAsDataUrl(await response.blob());
  } catch {
    return null;
  }
}

function fitText(pdf: jsPDF, value: string, maxWidth: number) {
  if (pdf.getTextWidth(value) <= maxWidth) return value;
  let shortened = value;
  while (shortened.length > 1 && pdf.getTextWidth(`${shortened}...`) > maxWidth) shortened = shortened.slice(0, -1);
  return `${shortened.trimEnd()}...`;
}

function drawSectionTitle(pdf: jsPDF, title: string, y: number) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...MUTED);
  pdf.text(title.toUpperCase(), MARGIN_X, y, { charSpace: 1.4 });
  pdf.setTextColor(...TEXT);
}

function drawPlaneMark(pdf: jsPDF, centerX: number, centerY: number) {
  pdf.setFillColor(0, 0, 0);
  pdf.circle(centerX, centerY, 5.2, "F");
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.55);
  pdf.line(centerX - 2.8, centerY, centerX + 2.8, centerY);
  pdf.line(centerX, centerY - 3, centerX + 0.5, centerY + 3);
  pdf.line(centerX - 1.9, centerY, centerX - 2.8, centerY + 1.4);
  pdf.line(centerX + 1.7, centerY, centerX + 2.5, centerY - 1.2);
}

function drawLogoBadge(pdf: jsPDF, airline: Airline, dataUrl: string | null, x: number, y: number, size: number) {
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(218, 221, 226);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(x, y, size, size, 2, 2, "FD");
  if (dataUrl) {
    const inset = size * 0.05;
    pdf.addImage(dataUrl, "PNG", x + inset, y + inset, size - inset * 2, size - inset * 2, undefined, "FAST");
    return;
  }
  pdf.setFillColor(...colorTuple(airline.logoColor));
  pdf.roundedRect(x + 0.5, y + 0.5, size - 1, size - 1, 1.6, 1.6, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(size * 1.45);
  pdf.setTextColor(255, 255, 255);
  pdf.text(airline.code, x + size / 2, y + size * 0.66, { align: "center" });
  pdf.setTextColor(...TEXT);
}

export async function downloadItineraryPdf(booking: Booking, filename: string) {
  if (!booking.flights.length || !booking.flights[0]?.segments.length) throw new Error("Booking has no flights");

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  pdf.setDisplayMode("fullpage", "single", null);
  pdf.setProperties({
    title: `SkyBook itinerary ${booking.bookingReference}`,
    subject: "Flight itinerary",
    author: "SkyBook",
    creator: "SkyBook",
  });

  const airlines = [...new Map(
    booking.flights.flatMap((flight) => flight.segments.map((segment) => [segment.airline.id, segment.airline] as const))
  ).values()];
  const logoEntries = await Promise.all(airlines.map(async (airline) => [airline.id, await loadAirlineLogo(airline)] as const));
  const logos = new Map(logoEntries);
  const qrDataUrl = await QRCode.toDataURL(getVerificationUrl(booking.bookingReference, booking.verificationToken), {
    width: 320,
    margin: 1,
    color: { dark: "#0b1220", light: "#ffffff" },
  });
  const primaryFlight = booking.flights[0];
  const primaryFirst = primaryFlight.segments[0];
  const primaryAirline = findAirline(primaryFirst.airline.id) ?? primaryFirst.airline;
  const accent = colorTuple(primaryAirline.logoColor);
  let y = MARGIN_TOP;

  const drawContinuationHeader = () => {
    drawPlaneMark(pdf, MARGIN_X + 5.2, MARGIN_TOP + 5.2);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...TEXT);
    pdf.text("SkyBook", MARGIN_X + 12.5, MARGIN_TOP + 5.2);
    pdf.setFontSize(6.2);
    pdf.setTextColor(...MUTED);
    pdf.text(`ITINERARY / ${booking.bookingReference}`, PAGE_WIDTH - MARGIN_X, MARGIN_TOP + 5.2, { align: "right" });
    pdf.setDrawColor(...accent);
    pdf.setLineWidth(0.8);
    pdf.line(MARGIN_X, MARGIN_TOP + 11.5, PAGE_WIDTH - MARGIN_X, MARGIN_TOP + 11.5);
    y = MARGIN_TOP + 18;
  };

  const addPage = () => {
    pdf.addPage();
    drawContinuationHeader();
  };

  const ensureSpace = (height: number) => {
    if (y + height > PAGE_HEIGHT - MARGIN_BOTTOM) addPage();
  };

  // Full first-page header.
  drawPlaneMark(pdf, MARGIN_X + 5.2, y + 5.2);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(...TEXT);
  pdf.text("SkyBook", MARGIN_X + 12.5, y + 4.7);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...MUTED);
  pdf.text("TRAVEL ITINERARY", MARGIN_X + 12.5, y + 9.2, { charSpace: 1.2 });
  pdf.setFontSize(6.5);
  pdf.text("BOOKING REFERENCE", PAGE_WIDTH - MARGIN_X, y + 1.8, { align: "right" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...TEXT);
  pdf.text(booking.bookingReference, PAGE_WIDTH - MARGIN_X, y + 8.5, { align: "right", charSpace: 2.2 });
  pdf.setDrawColor(...accent);
  pdf.setLineWidth(0.9);
  pdf.line(MARGIN_X, y + 13.5, PAGE_WIDTH - MARGIN_X, y + 13.5);
  y += 19;

  // Booking status card.
  pdf.setDrawColor(...LIGHT);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(MARGIN_X, y, CONTENT_WIDTH, 22, 3, 3, "S");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...MUTED);
  pdf.text("BOOKING STATUS", MARGIN_X + 5, y + 8, { charSpace: 1.1 });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...TEXT);
  pdf.text(bookingStatusLabel(booking.status), MARGIN_X + 5, y + 13.2);
  pdf.addImage(qrDataUrl, "PNG", PAGE_WIDTH - MARGIN_X - 18.5, y + 2.1, 17, 17, undefined, "FAST");
  y += 29;

  // Passenger information.
  const passengerHeight = 8 + booking.passengers.length * 7 + (booking.seatAssignment ? 7 : 1);
  ensureSpace(passengerHeight + 7);
  drawSectionTitle(pdf, "Passenger Information", y);
  y += 5;
  pdf.setDrawColor(226, 229, 234);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  for (const passenger of booking.passengers) {
    y += 5.1;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...TEXT);
    pdf.text(fitText(pdf, `${passenger.firstName} ${passenger.lastName}`, 105), MARGIN_X, y);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...MUTED);
    const passengerMeta = `${passenger.type.charAt(0).toUpperCase()}${passenger.type.slice(1)} - ${passenger.nationality}`;
    pdf.text(fitText(pdf, passengerMeta, 60), PAGE_WIDTH - MARGIN_X, y, { align: "right" });
    pdf.setDrawColor(235, 237, 240);
    pdf.line(MARGIN_X, y + 2.1, PAGE_WIDTH - MARGIN_X, y + 2.1);
    y += 1.8;
  }
  if (booking.seatAssignment) {
    y += 4;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...MUTED);
    pdf.text("Seat assignment:", MARGIN_X, y);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...TEXT);
    pdf.text(booking.seatAssignment, MARGIN_X + 24, y);
  }
  y += 9;

  // Flight cards.
  drawSectionTitle(pdf, "Flight Information", y);
  y += 5;
  for (let index = 0; index < booking.flights.length; index += 1) {
    const flight = booking.flights[index];
    const first = flight.segments[0];
    const last = flight.segments[flight.segments.length - 1];
    const airline = findAirline(first.airline.id) ?? first.airline;
    const cardHeight = 40;
    const startsContinuationPage = index > 0 && index % 4 === 0;
    if (startsContinuationPage || y + cardHeight > PAGE_HEIGHT - MARGIN_BOTTOM - 12) {
      addPage();
      drawSectionTitle(pdf, "Flight Information - Continued", y);
      y += 5;
    }

    pdf.setDrawColor(...LIGHT);
    pdf.setLineWidth(0.25);
    pdf.roundedRect(MARGIN_X, y, CONTENT_WIDTH, cardHeight, 3, 3, "S");
    pdf.setDrawColor(...colorTuple(airline.logoColor));
    pdf.setLineWidth(1.1);
    pdf.line(MARGIN_X + 1.2, y + 0.6, PAGE_WIDTH - MARGIN_X - 1.2, y + 0.6);
    drawLogoBadge(pdf, airline, logos.get(airline.id) ?? null, MARGIN_X + 4.5, y + 5, 8.5);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...TEXT);
    pdf.text(fitText(pdf, airline.name, 95), MARGIN_X + 16, y + 8.1);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...MUTED);
    const flightMeta = `${flight.segments.map((segment) => segment.flightNumber).join(", ")} - ${first.aircraft}`;
    pdf.text(fitText(pdf, flightMeta, 95), MARGIN_X + 16, y + 12.1);

    const cabin = cabinLabel(flight.cabin).toUpperCase();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.2);
    const cabinWidth = Math.max(18, pdf.getTextWidth(cabin) + 6);
    const cabinX = PAGE_WIDTH - MARGIN_X - cabinWidth - 4.5;
    pdf.setDrawColor(145, 151, 160);
    pdf.roundedRect(cabinX, y + 5.1, cabinWidth, 6.1, 3, 3, "S");
    pdf.setTextColor(...TEXT);
    pdf.text(cabin, cabinX + cabinWidth / 2, y + 9.1, { align: "center" });

    const leftX = MARGIN_X + 4.5;
    const rightX = PAGE_WIDTH - MARGIN_X - 4.5;
    const centerX = PAGE_WIDTH / 2;
    const routeY = y + 24;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(...TEXT);
    pdf.text(first.originCode, leftX, routeY);
    pdf.text(last.destinationCode, rightX, routeY, { align: "right" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.2);
    pdf.setTextColor(...MUTED);
    pdf.text(formatTime(first.departureTime), leftX, routeY + 5);
    pdf.text(formatTime(last.arrivalTime), rightX, routeY + 5, { align: "right" });
    pdf.setFontSize(6.1);
    pdf.setTextColor(156, 163, 175);
    pdf.text(formatDateLong(first.departureTime), leftX, routeY + 9);
    pdf.text(formatDateLong(last.arrivalTime), rightX, routeY + 9, { align: "right" });
    pdf.setFontSize(6.2);
    pdf.text(formatDuration(flight.totalDurationMinutes), centerX, routeY - 2.5, { align: "center" });
    pdf.setDrawColor(205, 209, 216);
    pdf.setLineDashPattern([1.2, 1.2], 0);
    pdf.line(MARGIN_X + 31, routeY, PAGE_WIDTH - MARGIN_X - 31, routeY);
    pdf.setLineDashPattern([], 0);
    const stops = flight.stops === 0 ? "Non-stop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`;
    pdf.text(stops, centerX, routeY + 5.5, { align: "center" });
    y += cardHeight + 4;
  }

  // Extras and totals.
  const extraItems = extrasLineItems(booking.extras);
  const extrasHeight = 22 + Math.max(extraItems.length, 1) * 6;
  ensureSpace(extrasHeight + 8);
  drawSectionTitle(pdf, "Extras & Price", y);
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.2);
  pdf.setTextColor(...TEXT);
  if (!extraItems.length) {
    pdf.setTextColor(...MUTED);
    pdf.text("No extras selected.", MARGIN_X, y);
    y += 6;
  } else {
    for (const item of extraItems) {
      pdf.setTextColor(...TEXT);
      pdf.text(item.label, MARGIN_X, y);
      if (item.price > 0) pdf.text(formatCurrency(item.price, booking.currency), PAGE_WIDTH - MARGIN_X, y, { align: "right" });
      y += 6;
    }
  }
  pdf.setDrawColor(...LIGHT);
  pdf.line(MARGIN_X, y - 1.5, PAGE_WIDTH - MARGIN_X, y - 1.5);
  pdf.setTextColor(...MUTED);
  pdf.text("Ticket price", MARGIN_X, y + 3);
  pdf.text(formatCurrency(booking.ticketPrice, booking.currency), PAGE_WIDTH - MARGIN_X, y + 3, { align: "right" });
  y += 6.5;
  pdf.setDrawColor(...TEXT);
  pdf.setLineWidth(0.55);
  pdf.line(MARGIN_X, y - 1.5, PAGE_WIDTH - MARGIN_X, y - 1.5);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.setTextColor(...TEXT);
  pdf.text("Total", MARGIN_X, y + 3.2);
  pdf.text(formatCurrency(booking.totalPrice, booking.currency), PAGE_WIDTH - MARGIN_X, y + 3.2, { align: "right" });
  y += 13;

  // Boarding pass.
  ensureSpace(48);
  pdf.setDrawColor(165, 170, 179);
  pdf.setLineWidth(0.25);
  pdf.setLineDashPattern([1, 1], 0);
  pdf.line(MARGIN_X, y, MARGIN_X + 76, y);
  pdf.line(PAGE_WIDTH - MARGIN_X - 76, y, PAGE_WIDTH - MARGIN_X, y);
  pdf.setLineDashPattern([], 0);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.2);
  pdf.setTextColor(156, 163, 175);
  pdf.text("BOARDING PASS", PAGE_WIDTH / 2, y + 1.2, { align: "center", charSpace: 1.1 });
  y += 5;
  const passHeight = 32;
  const qrColumnWidth = 28;
  pdf.setDrawColor(...TEXT);
  pdf.setLineWidth(0.55);
  pdf.roundedRect(MARGIN_X, y, CONTENT_WIDTH, passHeight, 3, 3, "S");
  const dividerX = PAGE_WIDTH - MARGIN_X - qrColumnWidth;
  pdf.setLineDashPattern([1.4, 1.1], 0);
  pdf.line(dividerX, y, dividerX, y + passHeight);
  pdf.setLineDashPattern([], 0);
  drawLogoBadge(pdf, primaryAirline, logos.get(primaryAirline.id) ?? null, MARGIN_X + 4.5, y + 3.5, 7.5);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.3);
  pdf.setTextColor(...TEXT);
  pdf.text(fitText(pdf, primaryAirline.name, 47), MARGIN_X + 14, y + 8.2);

  const columns = [
    { label: "PASSENGER", value: `${booking.passengers[0]?.firstName ?? ""} ${booking.passengers[0]?.lastName ?? ""}`, x: MARGIN_X + 4.5, width: 35 },
    { label: "FLIGHT", value: primaryFirst.flightNumber, x: MARGIN_X + 42, width: 25 },
    { label: "SEAT", value: booking.seatAssignment ?? "-", x: MARGIN_X + 75, width: 18 },
    { label: "GATE", value: booking.gate ?? "TBD", x: MARGIN_X + 108, width: 18 },
  ];
  for (const column of columns) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.4);
    pdf.setTextColor(...MUTED);
    pdf.text(column.label, column.x, y + 17);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...TEXT);
    pdf.text(fitText(pdf, column.value.trim(), column.width), column.x, y + 21.2);
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.text(`${primaryFirst.originCode} TO ${primaryFlight.segments[primaryFlight.segments.length - 1].destinationCode}`, MARGIN_X + 4.5, y + 27.2);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...MUTED);
  pdf.text(`${formatDateLong(primaryFirst.departureTime)} - ${formatTime(primaryFirst.departureTime)}`, dividerX - 4, y + 27.2, { align: "right" });
  pdf.addImage(qrDataUrl, "PNG", dividerX + 6, y + 3.5, 16, 16, undefined, "FAST");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6);
  pdf.setTextColor(...TEXT);
  pdf.text(booking.bookingReference, dividerX + qrColumnWidth / 2, y + 25, { align: "center", charSpace: 0.8 });
  y += passHeight + 10;

  // Footer.
  ensureSpace(18);
  pdf.setDrawColor(...LIGHT);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  y += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.8);
  pdf.setTextColor(...MUTED);
  const notice = "Please arrive at the airport at least 2 hours before departure for international flights (3 hours for connecting itineraries). Carry a valid passport and any required visas or travel documents. Baggage allowance and fare rules are shown in your booking confirmation.";
  const noticeLines = pdf.splitTextToSize(notice, CONTENT_WIDTH) as string[];
  pdf.text(noticeLines, MARGIN_X, y, { lineHeightFactor: 1.35 });
  y += noticeLines.length * 3.2 + 2;
  pdf.text(`Document generated ${formatDateLong(new Date().toISOString())}.`, MARGIN_X, y);

  pdf.save(filename);
}
