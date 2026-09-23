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

  if (booking === undefined) return <LoadingState label="Loading email preview…" />;

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Booking not found</h1>
        <Button className="mt-6" onClick={() => router.push("/platform/airline-booking-platform/trips")}>Go to My Trips</Button>
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
    <div className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="no-print mb-4">
          <Link href={`/platform/airline-booking-platform/trips/${booking.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#07599f] hover:text-[#043f75]">
            <ArrowLeft size={15} /> Back to booking details
          </Link>
        </div>

        <section className="no-print mb-5 rounded-2xl border border-[#bfd7ee] bg-[#edf6ff] p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#07599f] text-white">
              <Mail size={17} />
            </span>
            <div>
              <h1 className="text-sm font-bold text-[#073763]">Send confirmation email</h1>
              <p className="text-xs text-slate-600">Enter the email address that should receive this itinerary.</p>
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
              className="min-w-0 flex-1 rounded-xl border border-[#aac9e5] bg-white px-3.5 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#07599f] focus:ring-2 focus:ring-[#07599f]/15"
            />
            <Button type="button" onClick={sendEmail} className="sm:w-auto">
              <Send size={16} /> Send email
            </Button>
          </div>
        </section>

        <div className="overflow-hidden rounded-2xl border border-[#c9d9e8] bg-white shadow-xl shadow-slate-300/40">
          <div className="space-y-1 border-b border-[#d7e4ef] bg-[#f3f8fd] px-5 py-4 text-xs text-slate-600">
            <p><span className="font-bold text-[#073763]">From:</span> SkyBook &lt;no-reply@skybook.com&gt;</p>
            <p><span className="font-bold text-[#073763]">To:</span> {recipientEmail.trim() || "Enter a recipient above"}</p>
            <p><span className="font-bold text-[#073763]">Subject:</span> Your SkyBook itinerary — confirmation {booking.bookingReference}</p>
          </div>

          <div className="bg-white text-slate-800">
            <div className="bg-gradient-to-r from-[#043f75] via-[#07599f] to-[#0877c9] px-6 py-8 text-center text-white">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/15 shadow-inner">
                <Plane size={24} className="-rotate-12" />
              </span>
              <p className="mt-3 text-2xl font-bold tracking-tight">SkyBook</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-blue-100">Booking confirmation</p>
            </div>

            <div className="px-6 py-7 sm:px-8">
              <p className="text-base font-semibold text-[#073763]">Hi {booking.passengers[0]?.firstName ?? "traveler"},</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Thanks for booking with SkyBook. Here&apos;s your itinerary for your records.
              </p>

              <div className="mt-6 rounded-xl border border-[#bdd8ef] bg-[#edf6ff] p-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#477394]">Booking reference</p>
                <p className="mt-1 text-2xl font-bold tracking-[0.18em] text-[#07599f]">{booking.bookingReference}</p>
              </div>

              <div className="mt-6 space-y-4">
                {booking.flights.map((flight, idx) => {
                  const first = flight.segments[0];
                  const last = flight.segments[flight.segments.length - 1];
                  return (
                    <div key={idx} className="overflow-hidden rounded-xl border border-[#cfdfed] bg-white">
                      <div className="flex items-center justify-between border-b border-[#dce8f2] bg-[#f7fbff] px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-bold text-[#073763]">
                          <AirlineLogo airline={first.airline} size={24} />
                          {first.airline.name}
                        </span>
                        <span className="rounded-full bg-[#dceeff] px-2.5 py-1 text-[11px] font-semibold text-[#07599f]">{cabinLabel(flight.cabin)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 px-4 py-4 text-sm">
                        <div>
                          <p className="text-xl font-bold text-[#073763]">{formatTime(first.departureTime)}</p>
                          <p className="mt-0.5 text-xs text-slate-500"><strong className="text-[#07599f]">{first.originCode}</strong> · {formatDateLong(first.departureTime)}</p>
                        </div>
                        <div className="flex min-w-12 flex-1 items-center text-[#78a9cf]">
                          <span className="h-px flex-1 bg-[#b8d1e5]" />
                          <Plane size={15} className="mx-2 rotate-90" />
                          <span className="h-px flex-1 bg-[#b8d1e5]" />
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#073763]">{formatTime(last.arrivalTime)}</p>
                          <p className="mt-0.5 text-xs text-slate-500"><strong className="text-[#07599f]">{last.destinationCode}</strong> · {formatDateLong(last.arrivalTime)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-xl bg-[#f4f8fc] p-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#477394]">Passengers</p>
                <ul className="space-y-1 text-sm text-slate-700">
                  {booking.passengers.map((passenger) => (
                    <li key={passenger.id}>{passenger.firstName} {passenger.lastName}</li>
                  ))}
                </ul>
                {booking.seatAssignment && (
                  <p className="mt-2 text-sm text-slate-600">Seat: <strong className="text-[#07599f]">{booking.seatAssignment}</strong></p>
                )}
              </div>

              {extraLineItems.length > 0 && (
                <div className="mt-5">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#477394]">Extras</p>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {extraLineItems.map((item) => (
                      <li key={item.label} className="flex justify-between">
                        <span>{item.label}</span>
                        {item.price > 0 && <span>{formatCurrency(item.price, booking.currency)}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex justify-between border-t-2 border-[#d7e5f1] pt-4 text-base font-bold text-[#073763]">
                <span>Total</span>
                <span className="text-[#07599f]">{formatCurrency(booking.totalPrice, booking.currency)}</span>
              </div>

              <p className="mt-7 text-center text-xs font-medium text-slate-500">Safe travels! — The SkyBook team</p>
            </div>

            <div className="border-t border-[#d7e5f1] bg-[#edf6ff] px-6 py-4 text-center text-[11px] font-medium text-[#477394]">
              SkyBook · Booking confirmation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
