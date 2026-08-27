import { airlines } from "./airlines";
import { findAirport } from "./airports";
import type { CabinClass, Flight, FlightSearchParams, FlightSegment } from "@/lib/airline/types";
import { hashString, seedRandom } from "@/lib/airline/utils";

const CABIN_MULTIPLIER: Record<CabinClass, number> = {
  economy: 1,
  premium_economy: 1.6,
  business: 2.9,
  first: 4.5,
};

const MEAL_NONE = "none";

function pickAircraft(rand: () => number, aircraftTypes: string[]) {
  return aircraftTypes[Math.floor(rand() * aircraftTypes.length)];
}

function distanceEstimate(originCode: string, destinationCode: string) {
  const seed = hashString(`${originCode}-${destinationCode}`);
  // Produce a stable pseudo-distance-driven duration baseline between 65 and 980 minutes.
  return 65 + (seed % 915);
}

function buildSegment(
  rand: () => number,
  origin: string,
  destination: string,
  departure: Date
): FlightSegment {
  const airline = airlines[Math.floor(rand() * airlines.length)];
  const baseDuration = distanceEstimate(origin, destination);
  const jitter = Math.floor(rand() * 40) - 20;
  const durationMinutes = Math.max(45, baseDuration + jitter);
  const arrival = new Date(departure.getTime() + durationMinutes * 60000);
  const flightNumber = `${airline.code}${100 + Math.floor(rand() * 8899)}`;
  return {
    id: `${flightNumber}-${origin}-${destination}-${departure.getTime()}`,
    airline,
    flightNumber,
    originCode: origin,
    destinationCode: destination,
    departureTime: departure.toISOString(),
    arrivalTime: arrival.toISOString(),
    durationMinutes,
    aircraft: pickAircraft(rand, airline.aircraftTypes.length ? airline.aircraftTypes : ["Airbus A320"]),
  };
}

const MEALS = ["Standard Meal", "Vegetarian", "Vegan", "Halal", "Kosher", MEAL_NONE];

export function generateFlights(params: FlightSearchParams, count = 12): Flight[] {
  const originAirport = findAirport(params.from);
  const destinationAirport = findAirport(params.to);
  if (!originAirport || !destinationAirport) return [];

  const seedKey = `${params.from}-${params.to}-${params.departureDate}-${params.cabin}`;
  const rand = seedRandom(hashString(seedKey) || 1);

  const flights: Flight[] = [];
  const baseDate = new Date(`${params.departureDate}T00:00:00`);

  for (let i = 0; i < count; i++) {
    const stops = rand() < 0.42 ? 0 : rand() < 0.75 ? 1 : 2;
    const departureHour = 4 + Math.floor(rand() * 19);
    const departureMinute = Math.floor(rand() * 12) * 5;
    const departure = new Date(baseDate);
    departure.setHours(departureHour, departureMinute, 0, 0);

    const segments: FlightSegment[] = [];
    let currentOrigin = params.from;
    let currentDeparture = departure;

    const stopCodes = ["ATL", "ORD", "DXB", "IST", "FRA", "AMS", "SIN", "LHR", "DFW", "DOH"].filter(
      (c) => c !== params.from && c !== params.to
    );

    for (let s = 0; s <= stops; s++) {
      const isLast = s === stops;
      const segDestination = isLast ? params.to : stopCodes[Math.floor(rand() * stopCodes.length)];
      const seg = buildSegment(rand, currentOrigin, segDestination, currentDeparture);
      segments.push(seg);
      currentOrigin = segDestination;
      const layoverMinutes = 45 + Math.floor(rand() * 105);
      currentDeparture = new Date(new Date(seg.arrivalTime).getTime() + layoverMinutes * 60000);
    }

    const totalDurationMinutes = Math.round(
      (new Date(segments[segments.length - 1].arrivalTime).getTime() - new Date(segments[0].departureTime).getTime()) /
        60000
    );

    const distanceFactor = distanceEstimate(params.from, params.to) / 60;
    const basePrice = 90 + distanceFactor * 38;
    const stopsDiscount = stops === 0 ? 1.15 : stops === 1 ? 1 : 0.88;
    const cabinPrice = basePrice * CABIN_MULTIPLIER[params.cabin] * stopsDiscount;
    const priceJitter = 0.85 + rand() * 0.3;
    const price = Math.round((cabinPrice * priceJitter) / 5) * 5;

    const airline = segments[0].airline;

    flights.push({
      id: `FL-${seedKey}-${i}`.replace(/\s+/g, ""),
      segments,
      stops,
      totalDurationMinutes,
      cabin: params.cabin,
      price,
      currency: "USD",
      availableSeats: 1 + Math.floor(rand() * 9),
      refundable: rand() < 0.35,
      baggageIncluded: airline.baggageAllowance.checked,
    });
  }

  return flights.sort(
    (a, b) => new Date(a.segments[0].departureTime).getTime() - new Date(b.segments[0].departureTime).getTime()
  );
}

export const MEAL_OPTIONS = MEALS;
