"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plane } from "lucide-react";
import { getBooking } from "@/lib/airline/services/bookings";
import { QRCodeImage } from "@/components/airline/booking/qr-code";
import { DownloadPdfButton } from "@/components/airline/booking/download-pdf-button";
import { AirlineLogo } from "@/components/airline/ui/airline-logo";
import { LoadingState } from "@/components/airline/ui/loading-state";
import { getVerificationUrl } from "@/lib/airline/verification-url";
import { cabinLabel, formatDateLong, formatTime } from "@/lib/airline/utils";
import type { Booking } from "@/lib/airline/types";

function defaultBoardingTime(departureIso: string) {
  return formatTime(new Date(new Date(departureIso).getTime() - 45 * 60000).toISOString());
}

function defaultGateFor(flightId: string) {
  const letters = "ABCDEFGHJK";
  const sum = flightId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return `${letters[sum % letters.length]}${(sum % 30) + 1}`;
}

function defaultTerminalFor(flightId: string) {
  const sum = flightId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return String(1 + (sum % 5));
}

function boardingGroupFor(flightId: string) {
  const sum = flightId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return `${"ABC"[sum % 3]}${(sum % 6) + 1}`;
}

function BarcodeStrip({ seed }: { seed: string }) {
  const sum = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const bars = Array.from({ length: 34 }, (_, i) => (((sum * (i + 7)) % 5) + 1) * 2);
  return (
    <div className="flex h-10 items-stretch gap-[2px]" aria-hidden>
      {bars.map((w, i) => (
        <span key={i} className="bg-foreground" style={{ width: w }} />
      ))}
    </div>
  );
}

export default function BoardingPassPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [legIndex, setLegIndex] = useState(0);

  useEffect(() => {
    getBooking(bookingId).then(setBooking);
  }, [bookingId]);

  if (booking === undefined) {
    return <LoadingState label="Loading boarding pass…" />;
  }
  if (!booking) {
    return <div className="mx-auto max-w-2xl px-4 py-24 text-center text-foreground/50">Boarding pass not found.</div>;
  }

  const flight = booking.flights[legIndex];
  const first = flight.segments[0];
  const last = flight.segments[flight.segments.length - 1];
  const passenger = booking.passengers[0];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-center text-2xl font-bold">Mobile Boarding Pass</h1>

      {booking.flights.length > 1 && (
        <div className="no-print mb-4 flex justify-center gap-2">
          {booking.flights.map((_, i) => (
            <button
              key={i}
              onClick={() => setLegIndex(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                legIndex === i ? "bg-brand-600 text-white" : "bg-black/5 dark:bg-white/10"
              }`}
            >
              Flight {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-neutral-900">
        <div className="flex items-center justify-between bg-gradient-to-r from-brand-700 to-brand-600 p-5 text-white">
          <div className="flex items-center gap-2.5">
            <AirlineLogo airline={first.airline} size={34} />
            <div>
              <p className="font-semibold">{first.airline.name}</p>
              <p className="text-xs text-white/70">{cabinLabel(flight.cabin)}</p>
            </div>
          </div>
          <Plane size={22} className="opacity-70" />
        </div>

        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          <div>
            <p className="text-xs text-foreground/50">Passenger</p>
            <p className="font-semibold">{passenger?.firstName} {passenger?.lastName}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/50">Flight</p>
            <p className="font-semibold">{first.flightNumber}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/50">Seat</p>
            <p className="font-semibold">{booking.seatAssignment ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-foreground/50">Group / Zone</p>
            <p className="font-semibold">{boardingGroupFor(flight.id)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 pb-2">
          <div>
            <p className="text-2xl font-bold">{first.originCode}</p>
            <p className="text-xs text-foreground/50">{formatTime(first.departureTime)}</p>
          </div>
          <Plane size={16} className="rotate-90 text-foreground/30" />
          <div className="text-right">
            <p className="text-2xl font-bold">{last.destinationCode}</p>
            <p className="text-xs text-foreground/50">{formatTime(last.arrivalTime)}</p>
          </div>
        </div>

        <div className="relative border-t-2 border-dashed border-black/15 dark:border-white/15">
          <span className="absolute left-0 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
          <span className="absolute right-0 top-1/2 h-6 w-6 -translate-y-1/2 translate-x-1/2 rounded-full bg-background" />
          <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
            <div>
              <p className="text-xs text-foreground/50">Date</p>
              <p className="text-sm font-medium">{formatDateLong(first.departureTime)}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/50">Boarding</p>
              <p className="text-sm font-medium">{booking.boardingTime ?? defaultBoardingTime(first.departureTime)}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/50">Gate</p>
              <p className="text-sm font-medium">{booking.gate ?? defaultGateFor(flight.id)}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/50">Terminal</p>
              <p className="text-sm font-medium">{booking.terminal ?? defaultTerminalFor(flight.id)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-black/[0.02] p-6 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground/50">Booking reference</p>
              <p className="font-mono text-lg font-bold tracking-widest">{booking.bookingReference}</p>
            </div>
            <QRCodeImage value={getVerificationUrl(booking.bookingReference, booking.verificationToken)} size={100} />
          </div>
          <div>
            <BarcodeStrip seed={`${booking.bookingReference}-${flight.id}`} />
            <p className="mt-1 text-center text-[10px] uppercase tracking-widest text-foreground/40">Scan at gate</p>
          </div>
        </div>
      </div>

      <div className="no-print mt-6 flex justify-center">
        <DownloadPdfButton label="Download boarding pass (PDF)" />
      </div>
    </div>
  );
}
