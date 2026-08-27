"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, CalendarClock, DoorOpen, Layers, MapPin, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent } from "@/components/airline/ui/card";
import { Badge } from "@/components/airline/ui/badge";
import { Button } from "@/components/airline/ui/button";
import { AirlineLogo } from "@/components/airline/ui/airline-logo";
import { LoadingState } from "@/components/airline/ui/loading-state";
import { EmptyState } from "@/components/airline/ui/empty-state";
import { QRCodeImage } from "@/components/airline/booking/qr-code";
import { getBookingByReferenceAndToken } from "@/lib/airline/services/bookings";
import { extrasLineItems } from "@/lib/airline/data/extras-pricing";
import { bookingStatusLabel, bookingStatusTone } from "@/lib/airline/data/booking-status";
import { getVerificationUrl } from "@/lib/airline/verification-url";
import { cabinLabel, formatCurrency, formatDateLong, formatDuration, formatTime } from "@/lib/airline/utils";
import type { Booking } from "@/lib/airline/types";
import "@/app/platform/platform-themes.css";

/**
 * Public, unauthenticated booking-verification page — deliberately outside
 * /platform/airline-booking-platform (which requires an active license),
 * since whoever scans a boarding pass QR code (e.g. gate staff) won't hold
 * a Nexova license themselves. Access is authorized by the reference+token
 * pair in the URL, not by license or login.
 */
export default function VerifyBoardingPassPage() {
  const { reference } = useParams<{ reference: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);

  useEffect(() => {
    getBookingByReferenceAndToken(decodeURIComponent(reference), token).then(setBooking);
  }, [reference, token]);

  if (booking === undefined) {
    return <LoadingState label="Verifying booking…" />;
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6 lg:px-8">
        <EmptyState
          icon={<ShieldCheck size={22} />}
          title="Booking not found"
          description="Please check your booking reference or contact support."
        />
        <Link href="/">
          <Button className="mt-6">Return to homepage</Button>
        </Link>
      </div>
    );
  }

  const extraLineItems = extrasLineItems(booking.extras);
  const primaryFlight = booking.flights[0];
  const primaryFirst = primaryFlight.segments[0];
  const primaryLast = primaryFlight.segments[primaryFlight.segments.length - 1];

  return (
    <div className="airline-theme">
      <div className="relative overflow-hidden bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700 pb-20 pt-14 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(1.5px_1.5px_at_12%_25%,white,transparent),radial-gradient(1px_1px_at_85%_20%,white,transparent),radial-gradient(1px_1px_at_60%_60%,white,transparent),radial-gradient(1.5px_1.5px_at_30%_75%,white,transparent)]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur">
            <BadgeCheck size={32} />
          </span>
          <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Booking Verified</h1>
          <div className="mt-5 flex items-center justify-center gap-2">
            <MapPin size={14} className="text-gold-400" />
            <p className="text-lg font-semibold tracking-wide">
              {primaryFirst.originCode} <span className="text-white/50">→</span> {primaryLast.destinationCode}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="-mt-6 mb-6 flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5 dark:bg-white/[0.04] dark:ring-white/10 sm:flex-row">
          <div className="flex-1 px-5 pb-5 pt-9 sm:px-6 sm:pb-6">
            <p className="text-xs uppercase tracking-wide text-foreground/50">Booking reference</p>
            <p className="text-2xl font-bold tracking-widest text-brand-700 dark:text-brand-400 sm:text-3xl">
              {booking.bookingReference}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={bookingStatusTone(booking.status)}>{bookingStatusLabel(booking.status)}</Badge>
              {booking.rebookedAt && <Badge tone="gold">Rebooked</Badge>}
            </div>
            <p className="mt-2 text-xs text-foreground/50">Created {formatDateLong(booking.createdAt)}</p>
          </div>

          <div className="relative flex shrink-0 items-center justify-center border-t border-dashed border-black/15 px-5 pb-5 pt-5 dark:border-white/15 sm:border-l sm:border-t-0 sm:px-6 sm:pb-6 sm:pt-9">
            <span className="absolute left-0 top-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
            <span className="absolute right-0 top-0 h-6 w-6 -translate-y-1/2 translate-x-1/2 rounded-full bg-background sm:right-auto sm:top-auto sm:bottom-0 sm:left-0 sm:translate-x-[-50%] sm:translate-y-1/2" />
            <QRCodeImage value={getVerificationUrl(booking.bookingReference, booking.verificationToken)} size={140} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          <div className="space-y-4 lg:col-span-2">
            {booking.flights.map((flight, idx) => {
              const first = flight.segments[0];
              const last = flight.segments[flight.segments.length - 1];
              return (
                <Card key={idx} className="overflow-hidden">
                  <div className="h-1" style={{ background: first.airline.logoColor }} />
                  <CardContent className="p-4 sm:p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <AirlineLogo airline={first.airline} size={32} className="shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{first.airline.name}</p>
                          <p className="truncate text-xs text-foreground/40">
                            {flight.segments.map((s) => s.flightNumber).join(", ")}
                          </p>
                        </div>
                      </div>
                      <Badge tone="brand" className="shrink-0">{cabinLabel(flight.cabin)}</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <p className="text-base font-bold sm:text-lg">{formatTime(first.departureTime)}</p>
                        <p className="truncate text-xs text-foreground/50 sm:text-sm">{first.originCode} · {formatDateLong(first.departureTime)}</p>
                      </div>
                      <div className="shrink-0 px-1.5 text-center text-[10px] text-foreground/40 sm:px-3 sm:text-xs">
                        {formatDuration(flight.totalDurationMinutes)}
                        <div className="my-1 w-8 border-t border-dashed border-black/15 dark:border-white/15 sm:w-12" />
                        {flight.stops === 0 ? "Non-stop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="text-base font-bold sm:text-lg">{formatTime(last.arrivalTime)}</p>
                        <p className="truncate text-xs text-foreground/50 sm:text-sm">{last.destinationCode} · {formatDateLong(last.arrivalTime)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex flex-wrap justify-center gap-3 pt-2 lg:justify-start">
              <Link href="/">
                <Button variant="outline">Return to homepage</Button>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Users size={16} className="text-brand-600 dark:text-brand-400" /> Passenger details
                </h3>
                <ul className="space-y-1.5 text-sm text-foreground/70">
                  {booking.passengers.map((p) => (
                    <li key={p.id}>
                      {p.firstName} {p.lastName} <span className="text-foreground/40">· {p.type} · {p.nationality}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <DoorOpen size={16} className="text-brand-600 dark:text-brand-400" /> Gate &amp; boarding
                </h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-foreground/50">Seat</p>
                    <p className="font-semibold">{booking.seatAssignment ?? "Not assigned"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/50">Gate</p>
                    <p className="font-semibold">{booking.gate ?? "TBD"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/50">Terminal</p>
                    <p className="font-semibold">{booking.terminal ?? "TBD"}</p>
                  </div>
                </div>
                {booking.boardingTime && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-foreground/60">
                    <CalendarClock size={14} /> Boarding: <strong className="text-foreground">{booking.boardingTime}</strong>
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Layers size={16} className="text-brand-600 dark:text-brand-400" /> Extras &amp; price
                </h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}
