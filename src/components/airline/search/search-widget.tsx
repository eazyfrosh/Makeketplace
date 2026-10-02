"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight, Plus, Search, Trash2 } from "lucide-react";
import { AirportAutocomplete } from "./airport-autocomplete";
import { PassengerCabinSelect } from "./passenger-cabin-select";
import { Button } from "@/components/airline/ui/button";
import type { CabinClass, PassengerCounts, TripType } from "@/lib/airline/types";
import { useSearchHistoryStore } from "@/lib/airline/store/search-history-store";
import { cn } from "@/lib/utils";
import { airlines } from "@/lib/airline/data/airlines";

const TRIP_TYPES: { value: TripType; label: string }[] = [
  { value: "one_way", label: "One-way" },
  { value: "round_trip", label: "Round-trip" },
  { value: "multi_city", label: "Multi-city" },
];

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
interface MultiSegment {
  from: string;
  to: string;
  date: string;
}

const blankSegments: MultiSegment[] = [
  { from: "", to: "", date: "" },
  { from: "", to: "", date: "" },
];

export function SearchWidget({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const addSearch = useSearchHistoryStore((s) => s.addSearch);
  const [tripType, setTripType] = useState<TripType>("round_trip");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState<PassengerCounts>({ adults: 1, children: 0, infants: 0 });
  const [cabin, setCabin] = useState<CabinClass>("economy");
  const [preferredAirline, setPreferredAirline] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customDepartureTime, setCustomDepartureTime] = useState("");
  const [customArrivalTime, setCustomArrivalTime] = useState("");
  const [customDurationHours, setCustomDurationHours] = useState("");
  const [customDurationMinutes, setCustomDurationMinutes] = useState("");
  const [segments, setSegments] = useState<MultiSegment[]>(blankSegments);
  const [autoFocusFrom, setAutoFocusFrom] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#search-widget") {
      setAutoFocusFrom(true);
    }
  }, []);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function updateSegment(idx: number, patch: Partial<MultiSegment>) {
    setSegments((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function submit() {
    const enteredPrice = customPrice.trim() ? Number(customPrice) : undefined;
    const parsedPrice = enteredPrice === undefined ? undefined : Math.round(enteredPrice * 100) / 100;
    if (parsedPrice !== undefined && (!Number.isFinite(parsedPrice) || parsedPrice <= 0 || parsedPrice > 1_000_000)) {
      toast.error("Enter a flight price between $1 and $1,000,000.");
      return;
    }
    const hasCustomDuration = Boolean(customDurationHours.trim() || customDurationMinutes.trim());
    const durationHours = customDurationHours.trim() ? Number(customDurationHours) : 0;
    const durationMinutes = customDurationMinutes.trim() ? Number(customDurationMinutes) : 0;
    const durationTotal = hasCustomDuration ? durationHours * 60 + durationMinutes : undefined;
    if (
      durationTotal !== undefined &&
      (!Number.isInteger(durationHours) ||
        !Number.isInteger(durationMinutes) ||
        durationHours < 0 ||
        durationMinutes < 0 ||
        durationMinutes > 59 ||
        durationTotal < 30 ||
        durationTotal > 72 * 60)
    ) {
      toast.error("Enter a flight duration between 30 minutes and 72 hours.");
      return;
    }

    if (tripType === "multi_city") {
      const incomplete = segments.some((s) => !s.from || !s.to || !s.date);
      if (incomplete) {
        toast.error("Please fill in every flight's origin, destination, and date.");
        return;
      }
    } else {
      if (!from || !to) {
        toast.error("Please choose a departure and destination airport.");
        return;
      }
      if (!departureDate) {
        toast.error("Please choose a departure date.");
        return;
      }
      if (tripType === "round_trip" && !returnDate) {
        toast.error("Please choose a return date.");
        return;
      }
    }

    const params = new URLSearchParams();
    params.set("tripType", tripType);
    params.set("passengers", JSON.stringify(passengers));
    params.set("cabin", cabin);
    const enteredAirline = preferredAirline.trim().slice(0, 80);
    if (enteredAirline) params.set("airline", enteredAirline);
    if (parsedPrice !== undefined) params.set("price", parsedPrice.toFixed(2));
    if (customDepartureTime) params.set("departureTime", customDepartureTime);
    if (customArrivalTime) params.set("arrivalTime", customArrivalTime);
    if (durationTotal !== undefined) params.set("duration", String(durationTotal));

    if (tripType === "multi_city") {
      params.set("segments", JSON.stringify(segments));
      params.set("from", segments[0].from);
      params.set("to", segments[segments.length - 1].to);
      params.set("departureDate", segments[0].date);
    } else {
      params.set("from", from);
      params.set("to", to);
      params.set("departureDate", departureDate);
      if (tripType === "round_trip") params.set("returnDate", returnDate);
      addSearch({
        from,
        to,
        departureDate,
        cabin,
        tripType,
        preferredAirlineId: enteredAirline || undefined,
        customPrice: parsedPrice,
        customDepartureTime: customDepartureTime || undefined,
        customArrivalTime: customArrivalTime || undefined,
        customDurationMinutes: durationTotal,
        timestamp: Date.now(),
      });
    }

    router.push(`/platform/airline-booking-platform/search?${params.toString()}`);
  }

  return (
    <div
      className={cn(
        "w-full rounded-3xl border border-black/8 bg-white/95 p-4 text-foreground shadow-2xl shadow-black/10 backdrop-blur sm:p-6 dark:border-white/10 dark:bg-neutral-900/90",
        compact && "p-3 sm:p-4"
      )}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {TRIP_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTripType(t.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              tripType === t.value
                ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                : "bg-black/5 text-foreground/70 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tripType !== "multi_city" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_1fr_1fr] md:items-end">
          <AirportAutocomplete label="From" value={from} onChange={setFrom} icon="from" openOnMount={autoFocusFrom} />

          <button
            type="button"
            onClick={swap}
            aria-label="Swap airports"
            className="mx-auto hidden h-10 w-10 items-center justify-center rounded-full border border-black/10 text-foreground/60 transition hover:bg-black/5 md:mb-1.5 md:flex dark:border-white/15 dark:hover:bg-white/10"
          >
            <ArrowLeftRight size={16} />
          </button>

          <AirportAutocomplete label="Destination" value={to} onChange={setTo} icon="to" />

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground/50">
              Departure
            </label>
            <input
              type="date"
              value={departureDate}
              min={todayISO()}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm dark:border-white/15 dark:bg-white/5"
            />
          </div>

          {tripType === "round_trip" ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground/50">
                Return
              </label>
              <input
                type="date"
                value={returnDate}
                min={departureDate || todayISO()}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm dark:border-white/15 dark:bg-white/5"
              />
            </div>
          ) : (
            <div className="hidden md:block" />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {segments.map((seg, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-3 rounded-xl bg-black/[0.02] p-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end dark:bg-white/5">
              <AirportAutocomplete
                label={`Flight ${idx + 1} From`}
                value={seg.from}
                onChange={(v) => updateSegment(idx, { from: v })}
                icon="from"
                openOnMount={idx === 0 && autoFocusFrom}
              />
              <AirportAutocomplete label="To" value={seg.to} onChange={(v) => updateSegment(idx, { to: v })} icon="to" />
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground/50">
                  Date
                </label>
                <input
                  type="date"
                  value={seg.date}
                  min={todayISO()}
                  onChange={(e) => updateSegment(idx, { date: e.target.value })}
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm dark:border-white/15 dark:bg-white/5"
                />
              </div>
              {segments.length > 2 && (
                <button
                  type="button"
                  onClick={() => setSegments((prev) => prev.filter((_, i) => i !== idx))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
          {segments.length < 5 && (
            <button
              type="button"
              onClick={() =>
                setSegments((prev) => [...prev, { from: prev[prev.length - 1]?.to ?? "", to: "", date: "" }])
              }
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400"
            >
              <Plus size={15} /> Add another flight
            </button>
          )}
        </div>
      )}

      <section className="mt-4 rounded-2xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Customize your flight</h3>
          <p className="mt-0.5 text-xs text-foreground/55">Set the airline, price, departure time, arrival time, and flight duration shown on your itinerary.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground/50" htmlFor="preferred-airline">
            Enter airline
          </label>
          <input
            id="preferred-airline"
            type="text"
            list="airline-suggestions"
            value={preferredAirline}
            onChange={(event) => setPreferredAirline(event.target.value)}
            placeholder="e.g. American Airlines or Delta"
            maxLength={80}
            className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-400 dark:border-white/15 dark:bg-neutral-900"
          />
          <datalist id="airline-suggestions">
            {airlines.map((airline) => (
              <option key={airline.id} value={airline.name}>{airline.code}</option>
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground/50" htmlFor="custom-flight-price">
            Flight price per passenger (USD)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-foreground/50">$</span>
            <input
              id="custom-flight-price"
              type="number"
              inputMode="decimal"
              min="1"
              max="1000000"
              step="0.01"
              value={customPrice}
              onChange={(event) => setCustomPrice(event.target.value)}
              placeholder="Use generated fares"
              className="w-full rounded-xl border border-black/10 bg-white py-3 pl-7 pr-3.5 text-sm outline-none focus:border-brand-400 dark:border-white/15 dark:bg-neutral-900"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground/50" htmlFor="custom-departure-time">
            Departure time
          </label>
          <input
            id="custom-departure-time"
            type="time"
            value={customDepartureTime}
            onChange={(event) => setCustomDepartureTime(event.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-400 dark:border-white/15 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground/50" htmlFor="custom-arrival-time">
            Arrival time
          </label>
          <input
            id="custom-arrival-time"
            type="time"
            value={customArrivalTime}
            onChange={(event) => {
              setCustomArrivalTime(event.target.value);
              if (event.target.value) {
                setCustomDurationHours("");
                setCustomDurationMinutes("");
              }
            }}
            className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-400 dark:border-white/15 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground/50">
            Flight duration
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              aria-label="Flight duration hours"
              type="number"
              inputMode="numeric"
              min="0"
              max="72"
              step="1"
              value={customDurationHours}
              onChange={(event) => {
                setCustomDurationHours(event.target.value);
                if (event.target.value) setCustomArrivalTime("");
              }}
              placeholder="Hours"
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none focus:border-brand-400 dark:border-white/15 dark:bg-neutral-900"
            />
            <input
              aria-label="Flight duration minutes"
              type="number"
              inputMode="numeric"
              min="0"
              max="59"
              step="1"
              value={customDurationMinutes}
              onChange={(event) => {
                setCustomDurationMinutes(event.target.value);
                if (event.target.value) setCustomArrivalTime("");
              }}
              placeholder="Minutes"
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none focus:border-brand-400 dark:border-white/15 dark:bg-neutral-900"
            />
          </div>
        </div>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
        <PassengerCabinSelect passengers={passengers} cabin={cabin} onChange={(p, c) => { setPassengers(p); setCabin(c); }} />
        <div className="flex items-end">
          <Button size="lg" className="w-full md:w-auto" onClick={submit}>
            <Search size={18} />
            Search Flights
          </Button>
        </div>
      </div>
    </div>
  );
}
