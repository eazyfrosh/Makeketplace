"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarClock, ShieldCheck, Ticket } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getBooking, cancelBooking } from "@/lib/airline/services/bookings";
import { Card, CardContent } from "@/components/airline/ui/card";
import { Badge } from "@/components/airline/ui/badge";
import { Button } from "@/components/airline/ui/button";
import { AirlineLogo } from "@/components/airline/ui/airline-logo";
import { LoadingState } from "@/components/airline/ui/loading-state";
import { DownloadPdfButton } from "@/components/airline/booking/download-pdf-button";
import { PrintableItinerary } from "@/components/airline/booking/printable-itinerary";
import { extrasLineItems } from "@/lib/airline/data/extras-pricing";
import { startRebooking } from "@/lib/airline/rebooking";
import { bookingStatusLabel, bookingStatusTone, canManageBooking } from "@/lib/airline/data/booking-status";
import { cabinLabel, formatCurrency, formatDateLong, formatTime } from "@/lib/airline/utils";
import type { Booking } from "@/lib/airline/types";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth/login?next=/platform/airline-booking-platform/trips/${id}`);
      return;
    }
    getBooking(id).then(setBooking);
  }, [id, user, loading, router]);

  if (loading || booking === undefined) {
    return <LoadingState label="Loading booking…" />;
  }

  if (!booking || (user && booking.userId !== user.uid)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Booking not found</h1>
        <Link href="/platform/airline-booking-platform/trips"><Button className="mt-6">Back to My Trips</Button></Link>
      </div>
    );
  }

  async function handleCancel() {
    if (!booking) return;
    await cancelBooking(booking);
    setBooking({ ...booking, status: "cancelled" });
    toast.success("Booking cancelled");
  }

  function handleRebook() {
    if (!booking) return;
    router.push(startRebooking(booking));
  }

  const extraLineItems = extrasLineItems(booking.extras);
  const manageable = canManageBooking(booking.status);

  return (
    <>
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 print:hidden">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Booking {booking.bookingReference}</h1>
          <Badge tone={bookingStatusTone(booking.status)} className="mt-1">
            {bookingStatusLabel(booking.status)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <DownloadPdfButton label="Download PDF itinerary" />
          {booking.status !== "cancelled" && (
            <Link href={`/platform/airline-booking-platform/boarding-pass/${booking.id}`}>
              <Button variant="secondary"><Ticket size={15} /> Boarding pass</Button>
            </Link>
          )}
          <Link href={`/verify-boarding-pass/${booking.bookingReference}?token=${booking.verificationToken}`} target="_blank">
            <Button variant="outline"><ShieldCheck size={15} /> Verification page</Button>
          </Link>
          {manageable && (
            <Button variant="outline" onClick={handleRebook}>
              <CalendarClock size={15} /> Rebook flight
            </Button>
          )}
          {manageable && (
            <Button variant="danger" onClick={handleCancel}>Cancel booking</Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
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

        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 font-semibold">Passenger details</h3>
            <ul className="space-y-1 text-sm text-foreground/70">
              {booking.passengers.map((p) => (
                <li key={p.id}>{p.firstName} {p.lastName} <span className="text-foreground/40">· {p.type}</span></li>
              ))}
            </ul>
            {booking.seatAssignment && (
              <p className="mt-3 text-sm text-foreground/60">Seat number: <strong>{booking.seatAssignment}</strong></p>
            )}
          </CardContent>
        </Card>

        <Card>
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
      </div>
    </div>
    <PrintableItinerary booking={booking} />
    </>
  );
}
