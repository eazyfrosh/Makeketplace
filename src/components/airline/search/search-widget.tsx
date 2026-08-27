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
      addSearch({ from, to, departureDate, cabin, tripType, timestamp: Date.now() });
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
