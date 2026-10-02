import { useBookingStore } from "@/lib/airline/store/booking-store";
import type { Booking, PassengerCounts } from "@/lib/airline/types";

function datePart(value: string) {
  return value.slice(0, 10);
}

function timePart(value: string) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * Opens the flight picker with the current itinerary prefilled so the booking
 * can be edited while retaining its passengers, extras, reference, and owner.
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

  const secondFlight = booking.flights[1];
  const secondFirst = secondFlight?.segments[0];
  const secondLast = secondFlight?.segments[secondFlight.segments.length - 1];
  const isRoundTrip = booking.flights.length === 2 &&
    secondFirst?.originCode === lastSegment.destinationCode &&
    secondLast?.destinationCode === firstSegment.originCode;
  const tripType = booking.flights.length > 1 ? (isRoundTrip ? "round_trip" : "multi_city") : "one_way";
  const params = new URLSearchParams({
    tripType,
    from: firstSegment.originCode,
    to: lastSegment.destinationCode,
    departureDate: datePart(firstSegment.departureTime),
    passengers: JSON.stringify(counts),
    cabin: flight.cabin,
    airline: firstSegment.airline.name,
    price: flight.price.toFixed(2),
    departureTime: timePart(firstSegment.departureTime),
    duration: String(flight.totalDurationMinutes),
  });

  if (tripType === "round_trip" && secondFlight && secondFirst && secondLast) {
    params.set("returnDate", datePart(secondFirst.departureTime));
    params.set("returnDepartureTime", timePart(secondFirst.departureTime));
    params.set("returnDuration", String(secondFlight.totalDurationMinutes));
  } else if (tripType === "multi_city") {
    params.set("segments", JSON.stringify(booking.flights.map((item) => {
      const first = item.segments[0];
      const last = item.segments[item.segments.length - 1];
      return { from: first.originCode, to: last.destinationCode, date: datePart(first.departureTime) };
    })));
  }

  return `/platform/airline-booking-platform/search?${params.toString()}`;
}
