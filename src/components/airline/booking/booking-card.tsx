import Link from "next/link";
import { CalendarClock, Ticket } from "lucide-react";
import type { Booking } from "@/lib/airline/types";
import { Badge } from "@/components/airline/ui/badge";
import { Button } from "@/components/airline/ui/button";
import { AirlineLogo } from "@/components/airline/ui/airline-logo";
import { bookingStatusLabel, bookingStatusTone, canManageBooking } from "@/lib/airline/data/booking-status";
import { cabinLabel, formatCurrency, formatDateLong, formatTime } from "@/lib/airline/utils";

interface BookingCardProps {
  booking: Booking;
  onCancel?: (booking: Booking) => void;
  onRebook?: (booking: Booking) => void;
}

export function BookingCard({ booking, onCancel, onRebook }: BookingCardProps) {
  const flight = booking.flights[0];
  const first = flight.segments[0];
  const last = flight.segments[flight.segments.length - 1];
  const manageable = canManageBooking(booking.status);

  return (
    <div className="rounded-2xl border border-black/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <AirlineLogo airline={first.airline} size={34} />
          <div>
            <p className="text-sm font-semibold">
              {first.originCode} → {last.destinationCode}
              {booking.flights.length > 1 && ` (+${booking.flights.length - 1} more)`}
            </p>
            <p className="text-xs text-foreground/50">{formatDateLong(first.departureTime)} · {formatTime(first.departureTime)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge tone="brand">{cabinLabel(flight.cabin)}</Badge>
          <Badge tone={bookingStatusTone(booking.status)}>{bookingStatusLabel(booking.status)}</Badge>
          {booking.rebookedAt && <Badge tone="gold">Rebooked</Badge>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/8 pt-4 dark:border-white/10">
        <div>
          <p className="font-mono text-sm font-semibold tracking-wide">{booking.bookingReference}</p>
          <p className="text-xs text-foreground/50">
            {booking.passengers.length} passenger{booking.passengers.length !== 1 ? "s" : ""} · {formatCurrency(booking.totalPrice, booking.currency)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/platform/airline-booking-platform/trips/${booking.id}`}>
            <Button size="sm" variant="outline">View details</Button>
          </Link>
          {booking.status !== "cancelled" && (
            <Link href={`/platform/airline-booking-platform/boarding-pass/${booking.id}`}>
              <Button size="sm" variant="secondary"><Ticket size={13} /> Boarding pass</Button>
            </Link>
          )}
          {manageable && onRebook && (
            <Button size="sm" variant="outline" onClick={() => onRebook(booking)}>
              <CalendarClock size={13} /> Rebook
            </Button>
          )}
          {manageable && onCancel && (
            <Button size="sm" variant="danger" onClick={() => onCancel(booking)}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
