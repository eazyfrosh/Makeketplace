import { useBookingStore } from "@/lib/airline/store/booking-store";
import type { Booking, PassengerCounts } from "@/lib/airline/types";

function todayISO(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Demo rebooking only replaces the first leg of the original itinerary with a
 * freshly chosen flight — a reasonable simplification of "change my flight"
 * rather than modeling full multi-leg re-shopping.
 */
export function startRebooking(booking: Booking): string {
  const flight = booking.flights[0];
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];

  const counts: PassengerCounts = { adults: 0, children: 0, infants: 0 };
  for (const p of booking.passengers) {
    if (p.type === "adult") counts.adults += 1;
    else if (p.type === "child") counts.children += 1;
    else counts.infants += 1;
  }
  if (counts.adults + counts.children + counts.infants === 0) counts.adults = 1;

  useBookingStore.getState().startRebooking(booking.id, booking.passengers, booking.extras);

  const params = new URLSearchParams({
    tripType: "one_way",
    from: firstSegment.originCode,
    to: lastSegment.destinationCode,
    departureDate: todayISO(7),
    passengers: JSON.stringify(counts),
    cabin: flight.cabin,
  });

  return `/platform/airline-booking-platform/search?${params.toString()}`;
}
