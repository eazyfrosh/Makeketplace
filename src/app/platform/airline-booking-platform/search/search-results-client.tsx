"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, SearchX, SlidersHorizontal } from "lucide-react";
import { countryFlag } from "@/lib/airline/data/country-flags";
import { generateFlights } from "@/lib/airline/data/flights";
import { findAirport } from "@/lib/airline/data/airports";
import type { CabinClass, Flight, PassengerCounts, TripType } from "@/lib/airline/types";
import { FlightCard } from "@/components/airline/results/flight-card";
import { FiltersSidebar, matchesFilters, type FiltersState } from "@/components/airline/results/filters-sidebar";
import { SortBar, type SortKey } from "@/components/airline/results/sort-bar";
import { FlightCardSkeleton } from "@/components/airline/ui/skeleton";
import { Button } from "@/components/airline/ui/button";
import { EmptyState } from "@/components/airline/ui/empty-state";
import { useBookingStore } from "@/lib/airline/store/booking-store";
import { RebookingBanner } from "@/components/airline/booking/rebooking-banner";
import { formatCurrency, formatDateLong } from "@/lib/airline/utils";

interface Leg {
  label: string;
  from: string;
  to: string;
  date: string;
}

function sortFlights(flights: Flight[], key: SortKey): Flight[] {
  const sorted = [...flights];
  switch (key) {
    case "price":
      return sorted.sort((a, b) => a.price - b.price);
    case "duration":
      return sorted.sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes);
    case "arrival":
      return sorted.sort(
        (a, b) =>
          new Date(a.segments[a.segments.length - 1].arrivalTime).getTime() -
          new Date(b.segments[b.segments.length - 1].arrivalTime).getTime()
      );
    case "departure":
    default:
      return sorted.sort(
        (a, b) => new Date(a.segments[0].departureTime).getTime() - new Date(b.segments[0].departureTime).getTime()
      );
  }
}

export function SearchResultsClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { setSearchParams, setItineraryLeg, itinerary, clearItinerary } = useBookingStore();

  const tripType = (params.get("tripType") as TripType) || "one_way";
  const cabin = (params.get("cabin") as CabinClass) || "economy";
  const passengers: PassengerCounts = useMemo(() => {
    try {
      return JSON.parse(params.get("passengers") || "") as PassengerCounts;
    } catch {
      return { adults: 1, children: 0, infants: 0 };
    }
  }, [params]);

  const legs: Leg[] = useMemo(() => {
    if (tripType === "multi_city") {
      try {
        const segments = JSON.parse(params.get("segments") || "[]") as { from: string; to: string; date: string }[];
        return segments.map((s, i) => ({ label: `Flight ${i + 1}`, from: s.from, to: s.to, date: s.date }));
      } catch {
        return [];
      }
    }
    const from = params.get("from") || "";
    const to = params.get("to") || "";
    const departureDate = params.get("departureDate") || "";
    if (tripType === "round_trip") {
      const returnDate = params.get("returnDate") || departureDate;
      return [
        { label: "Departing flight", from, to, date: departureDate },
        { label: "Return flight", from: to, to: from, date: returnDate },
      ];
    }
    return [{ label: "Your flight", from, to, date: departureDate }];
  }, [params, tripType]);

  const [activeLeg, setActiveLeg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("price");
  const [filters, setFilters] = useState<FiltersState>({
    stops: [],
    airlineIds: [],
    maxPrice: 5000,
    departureWindows: [],
    arrivalWindows: [],
    refundableOnly: false,
  });

  const paramsKey = params.toString();

  const hasSearchIntent = Boolean(params.get("from") || params.get("to") || params.get("segments"));

  useEffect(() => {
    if (!hasSearchIntent) {
      router.replace("/platform/airline-booking-platform#search-widget");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSearchIntent]);

  useEffect(() => {
    setSearchParams({
      tripType,
      from: legs[0]?.from ?? "",
      to: legs[0]?.to ?? "",
      departureDate: legs[0]?.date ?? "",
      passengers,
      cabin,
    });
    clearItinerary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  }, [activeLeg, paramsKey]);

  const currentLeg = legs[activeLeg];
  const originAirport = currentLeg ? findAirport(currentLeg.from) : undefined;
  const destinationAirport = currentLeg ? findAirport(currentLeg.to) : undefined;

  const rawFlights = useMemo(() => {
    if (!currentLeg || !originAirport || !destinationAirport) return [];
    return generateFlights({
      tripType,
      from: currentLeg.from,
      to: currentLeg.to,
      departureDate: currentLeg.date,
      passengers,
      cabin,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLeg?.from, currentLeg?.to, currentLeg?.date, cabin]);

  const priceCeiling = useMemo(
    () => Math.max(500, ...rawFlights.map((f) => Math.ceil(f.price / 50) * 50)),
    [rawFlights]
  );

  useEffect(() => {
    setFilters((f) => ({ ...f, maxPrice: priceCeiling }));
  }, [priceCeiling]);

  const filteredFlights = useMemo(
    () => sortFlights(rawFlights.filter((f) => matchesFilters(f, filters)), sortKey),
    [rawFlights, filters, sortKey]
  );

  const allLegsSelected = legs.length > 0 && legs.every((_, i) => itinerary[i]);
  const totalPrice = itinerary.reduce((sum, f) => sum + (f ? f.price : 0), 0) * Math.max(1, passengers.adults + passengers.children);

  function handleSelect(flight: Flight) {
    setItineraryLeg(activeLeg, flight);
    if (activeLeg < legs.length - 1) {
      setActiveLeg(activeLeg + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (!hasSearchIntent) {
    return null;
  }

  if (!currentLeg || !originAirport || !destinationAirport) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <AlertTriangle className="mx-auto mb-4 text-gold-500" size={36} />
        <h1 className="text-xl font-semibold">We couldn&apos;t read your search</h1>
        <p className="mt-2 text-foreground/60">Please start a new search.</p>
        <Button className="mt-6" onClick={() => router.push("/platform/airline-booking-platform")}>Back to search</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <RebookingBanner />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          <span aria-hidden>{countryFlag(originAirport.country)}</span> {originAirport.city}{" "}
          <ArrowRight className="inline" size={18} /> <span aria-hidden>{countryFlag(destinationAirport.country)}</span>{" "}
          {destinationAirport.city}
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          {formatDateLong(`${currentLeg.date}T00:00:00`)} · {passengers.adults + passengers.children + passengers.infants} passenger
          {passengers.adults + passengers.children + passengers.infants !== 1 ? "s" : ""}
        </p>
      </div>

      {legs.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {legs.map((leg, i) => (
            <button
              key={i}
              onClick={() => setActiveLeg(i)}
              className={`flex flex-col rounded-xl border px-4 py-2 text-left transition ${
                activeLeg === i
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                  : "border-black/10 dark:border-white/15"
              }`}
            >
              <span className="text-xs font-medium text-foreground/50">{leg.label}</span>
              <span className="text-sm font-semibold">
                {leg.from} → {leg.to}
                {itinerary[i] && <span className="ml-2 text-brand-600 dark:text-brand-400">✓ {formatCurrency(itinerary[i].price)}</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <FiltersSidebar flights={rawFlights} filters={filters} onChange={setFilters} priceCeiling={priceCeiling} />
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-foreground/60">
              {loading ? "Searching…" : `${filteredFlights.length} flights found`}
            </p>
            <SortBar value={sortKey} onChange={setSortKey} />
          </div>

          <details className="mb-4 lg:hidden">
            <summary className="flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium dark:border-white/15">
              <SlidersHorizontal size={15} /> Filters
            </summary>
            <div className="mt-3">
              <FiltersSidebar flights={rawFlights} filters={filters} onChange={setFilters} priceCeiling={priceCeiling} />
            </div>
          </details>

          <div className="space-y-4 pb-28">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <FlightCardSkeleton key={i} />)
            ) : filteredFlights.length === 0 ? (
              <EmptyState
                icon={<SearchX size={22} />}
                title="No flights match your filters"
                description="Try widening your price range or clearing a filter."
                action={
                  <Button variant="outline" onClick={() => setFilters((f) => ({ ...f, stops: [], airlineIds: [], departureWindows: [], arrivalWindows: [], refundableOnly: false, maxPrice: priceCeiling }))}>
                    Reset filters
                  </Button>
                }
              />
            ) : (
              filteredFlights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  selected={itinerary[activeLeg]?.id === flight.id}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {allLegsSelected && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-4 backdrop-blur dark:border-white/10 dark:bg-neutral-900/95">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs text-foreground/50">Total for all passengers</p>
              <p className="text-xl font-bold text-brand-700 dark:text-brand-400">{formatCurrency(totalPrice)}</p>
            </div>
            <Button size="lg" onClick={() => router.push("/platform/airline-booking-platform/booking/passengers")}>
              Continue to booking <ArrowRight size={17} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
