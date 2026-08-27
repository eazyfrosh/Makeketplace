"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/airline/ui/card";
import { Badge } from "@/components/airline/ui/badge";
import { Button } from "@/components/airline/ui/button";
import { AirlineLogo } from "@/components/airline/ui/airline-logo";
import { LoadingState } from "@/components/airline/ui/loading-state";
import { QRCodeImage } from "@/components/airline/booking/qr-code";
import { DownloadPdfButton } from "@/components/airline/booking/download-pdf-button";
import { PrintableItinerary } from "@/components/airline/booking/printable-itinerary";
import { getBooking } from "@/lib/airline/services/bookings";
import { extrasLineItems } from "@/lib/airline/data/extras-pricing";
import { getVerificationUrl } from "@/lib/airline/verification-url";
import { bookingStatusLabel, bookingStatusTone } from "@/lib/airline/data/booking-status";
import { cabinLabel, formatCurrency, formatDateLong, formatTime } from "@/lib/airline/utils";
import type { Booking } from "@/lib/airline/types";

export default function ConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);

  useEffect(() => {
    getBooking(bookingId).then(setBooking);
  }, [bookingId]);

  if (booking === undefined) {
    return <LoadingState label="Loading your booking…" />;
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Booking not found</h1>
        <p className="mt-2 text-foreground/60">This booking may have been removed or the link is incorrect.</p>
        <Button className="mt-6" onClick={() => router.push("/platform/airline-booking-platform/trips")}>Go to My Trips</Button>
      </div>
    );
  }

  const extraLineItems = extrasLineItems(booking.extras);
  const justRebooked = booking.rebookedAt && Date.now() - new Date(booking.rebookedAt).getTime() < 5 * 60 * 1000;

  return (
    <>
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 print:hidden">
      <div className="mb-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <CheckCircle2 size={32} />
        </span>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
          {justRebooked ? "Booking rebooked!" : "Booking confirmed!"}
        </h1>
        <p className="mt-1 text-foreground/60">
          A confirmation summary is ready for <strong>{booking.passengers[0]?.email}</strong>. No real email is sent.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-foreground/50">Booking reference</p>
            <p className="text-3xl font-bold tracking-widest text-brand-700 dark:text-brand-400">
              {booking.bookingReference}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
              <Badge tone={bookingStatusTone(booking.status)}>{bookingStatusLabel(booking.status)}</Badge>
              {booking.rebookedAt && <Badge tone="gold">Rebooked</Badge>}
            </div>
          </div>
          <QRCodeImage value={getVerificationUrl(booking.bookingReference, booking.verificationToken)} />
        </CardContent>
      </Card>

      <div className="mb-6 space-y-4">
        {booking.flights.map((flight, idx) => {
          const first = flight.segments[0];
          const last = flight.segments[flight.segments.length - 1];
          return (
            <Card key={idx}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AirlineLogo airline={first.airline} size={32} />
                    <p className="font-semibold">
                      {first.airline.name} <span className="text-foreground/40">· {flight.segments.map((s) => s.flightNumber).join(", ")}</span>
                    </p>
                  </div>
                  <Badge tone="brand">{cabinLabel(flight.cabin)}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-lg font-bold">{formatTime(first.departureTime)}</p>
                    <p className="text-foreground/50">{first.originCode} · {formatDateLong(first.departureTime)}</p>
                  </div>
                  <div className="text-foreground/40">→</div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatTime(last.arrivalTime)}</p>
                    <p className="text-foreground/50">{last.destinationCode} · {formatDateLong(last.arrivalTime)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mb-6">
        <CardContent className="p-5">
          <h3 className="mb-3 font-semibold">Passenger details</h3>
          <ul className="space-y-1.5 text-sm text-foreground/70">
            {booking.passengers.map((p) => (
              <li key={p.id}>
                {p.firstName} {p.lastName} <span className="text-foreground/40">· {p.type} · {p.nationality}</span>
              </li>
            ))}
          </ul>
          {booking.seatAssignment && (
            <p className="mt-3 text-sm text-foreground/60">Seat number: <strong>{booking.seatAssignment}</strong></p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-5">
          <h3 className="mb-3 font-semibold">Extras</h3>
          {extraLineItems.length === 0 ? (
            <p className="text-sm text-foreground/50">No extras selected.</p>
          ) : (
            <ul className="space-y-1.5 text-sm text-foreground/70">
              {extraLineItems.map((item) => (
                <li key={item.label} className="flex justify-between">
                  <span>{item.label}</span>
                  {item.price > 0 && <span>{formatCurrency(item.price, booking.currency)}</span>}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 space-y-1.5 border-t border-black/8 pt-3 text-sm dark:border-white/10">
            <div className="flex justify-between text-foreground/60">
              <span>Ticket price</span>
              <span>{formatCurrency(booking.ticketPrice, booking.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-black/8 pt-1.5 text-base font-bold dark:border-white/10">
              <span>Total</span>
              <span className="text-brand-700 dark:text-brand-400">{formatCurrency(booking.totalPrice, booking.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-center gap-3">
        <DownloadPdfButton label="Download PDF itinerary" />
        <Link href={`/platform/airline-booking-platform/boarding-pass/${booking.id}`}>
          <Button variant="secondary">
            <Ticket size={16} /> View boarding pass
          </Button>
        </Link>
        <Link href="/platform/airline-booking-platform/trips">
          <Button>Go to My Trips</Button>
        </Link>
      </div>
    </div>
    <PrintableItinerary booking={booking} />
    </>
  );
}
