"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Plane, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/airline/ui/button";
import { AirlineLogo } from "@/components/airline/ui/airline-logo";
import { LoadingState } from "@/components/airline/ui/loading-state";
import { getBooking } from "@/lib/airline/services/bookings";
import { extrasLineItems } from "@/lib/airline/data/extras-pricing";
import { cabinLabel, formatCurrency, formatDateLong, formatTime } from "@/lib/airline/utils";
import type { Booking } from "@/lib/airline/types";

export default function EmailPreviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [recipientEmail, setRecipientEmail] = useState("");

  useEffect(() => {
    getBooking(bookingId).then((foundBooking) => {
      setBooking(foundBooking);
      if (foundBooking) setRecipientEmail(foundBooking.passengers[0]?.email ?? "");
    });
  }, [bookingId]);

  if (booking === undefined) {
    return <LoadingState label="Loading email preview…" />;
  }
  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Booking not found</h1>
        <Button className="mt-6" onClick={() => router.push("/platform/airline-booking-platform/trips")}>Go to dashboard</Button>
      </div>
    );
  }

  const extraLineItems = extrasLineItems(booking.extras);

  function sendEmail() {
    if (!booking) return;
    const recipient = recipientEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      toast.error("Enter a valid recipient email address.");
      return;
    }

    const flightSummary = booking.flights
      .map((flight) => {
        const first = flight.segments[0];
        const last = flight.segments[flight.segments.length - 1];
        return `${first.airline.name}: ${first.originCode} to ${last.destinationCode} on ${formatDateLong(first.departureTime)}`;
      })
      .join("\n");
    const subject = `Your SkyBook itinerary — confirmation ${booking.bookingReference}`;
    const body = [
      `Hi ${booking.passengers[0]?.firstName ?? "traveler"},`,
      "",
      `Your SkyBook booking ${booking.bookingReference} is confirmed.`,
      "",
      flightSummary,
      "",
      `Total: ${formatCurrency(booking.totalPrice, booking.currency)}`,
      "",
      "Safe travels!",
      "The SkyBook team",
    ].join("\n");

    window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="no-print mb-4">
        <Link href={`/platform/airline-booking-platform/booking/confirmation/${booking.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
          <ArrowLeft size={15} /> Back to confirmation
        </Link>
      </div>

      <section className="no-print mb-5 rounded-2xl border border-brand-200 bg-brand-50/70 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
        <div className="mb-3 flex items-center gap-2">
          <Mail size={18} className="text-brand-600 dark:text-brand-400" />
          <div>
            <h1 className="text-sm font-semibold">Send confirmation email</h1>
            <p className="text-xs text-foreground/55">Enter the email address that should receive this itinerary.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="recipient-email">Recipient email</label>
          <input
            id="recipient-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            placeholder="name@example.com"
            className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-400 dark:border-white/15 dark:bg-neutral-900"
          />
          <Button type="button" onClick={sendEmail} className="sm:w-auto">
            <Send size={16} /> Send email
          </Button>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-black/10 shadow-lg dark:border-white/10">
        <div className="space-y-1 bg-black/[0.03] px-5 py-4 text-xs text-foreground/60 dark:bg-white/5">
          <p><span className="font-semibold text-foreground/80">From:</span> SkyBook &lt;no-reply@skybook.com&gt;</p>
          <p><span className="font-semibold text-foreground/80">To:</span> {recipientEmail.trim() || "Enter a recipient above"}</p>
          <p><span className="font-semibold text-foreground/80">Subject:</span> Your SkyBook itinerary — confirmation {booking.bookingReference}</p>
        </div>

        <div className="bg-white p-0 dark:bg-neutral-900">
          <div className="bg-gradient-to-r from-brand-700 to-brand-600 px-6 py-6 text-center text-white">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <Plane size={20} />
            </span>
            <p className="mt-2 text-lg font-bold">SkyBook</p>
          </div>

          <div className="px-6 py-6">
            <p className="text-sm text-foreground/70">Hi {booking.passengers[0]?.firstName ?? "traveler"},</p>
            <p className="mt-2 text-sm text-foreground/70">
              Thanks for booking with SkyBook. Here&apos;s your itinerary for your records.
            </p>

            <div className="mt-5 rounded-xl bg-black/[0.02] p-4 text-center dark:bg-white/5">
              <p className="text-xs uppercase tracking-wide text-foreground/50">Booking reference</p>
              <p className="text-2xl font-bold tracking-widest text-brand-700 dark:text-brand-400">{booking.bookingReference}</p>
            </div>

            <div className="mt-5 space-y-3">
              {booking.flights.map((flight, idx) => {
                const first = flight.segments[0];
                const last = flight.segments[flight.segments.length - 1];
                return (
                  <div key={idx} className="rounded-xl border border-black/8 p-4 dark:border-white/10">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <AirlineLogo airline={first.airline} size={24} />
                        {first.airline.name}
                      </span>
                      <span className="text-xs text-foreground/50">{cabinLabel(flight.cabin)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-bold">{formatTime(first.departureTime)}</p>
                        <p className="text-xs text-foreground/50">{first.originCode} · {formatDateLong(first.departureTime)}</p>
                      </div>
                      <span className="text-foreground/30">→</span>
                      <div className="text-right">
                        <p className="font-bold">{formatTime(last.arrivalTime)}</p>
                        <p className="text-xs text-foreground/50">{last.destinationCode} · {formatDateLong(last.arrivalTime)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/50">Passengers</p>
              <ul className="text-sm text-foreground/70">
                {booking.passengers.map((p) => (
                  <li key={p.id}>{p.firstName} {p.lastName}</li>
                ))}
              </ul>
              {booking.seatAssignment && (
                <p className="mt-1 text-sm text-foreground/60">Seat: <strong>{booking.seatAssignment}</strong></p>
              )}
            </div>

            {extraLineItems.length > 0 && (
              <div className="mt-5">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/50">Extras</p>
                <ul className="text-sm text-foreground/70">
                  {extraLineItems.map((item) => (
                    <li key={item.label} className="flex justify-between">
                      <span>{item.label}</span>
                      {item.price > 0 && <span>{formatCurrency(item.price, booking.currency)}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex justify-between border-t border-black/8 pt-3 text-sm font-bold dark:border-white/10">
              <span>Total</span>
              <span className="text-brand-700 dark:text-brand-400">{formatCurrency(booking.totalPrice, booking.currency)}</span>
            </div>

            <p className="mt-6 text-center text-xs text-foreground/40">
              Safe travels! — The SkyBook team
            </p>
          </div>

          <div className="border-t border-black/8 bg-black/[0.02] px-6 py-4 text-center text-[11px] text-foreground/40 dark:border-white/10 dark:bg-white/5">
            SkyBook · Booking confirmation
          </div>
        </div>
      </div>
    </div>
  );
}

