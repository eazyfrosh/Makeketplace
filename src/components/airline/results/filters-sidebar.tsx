"use client";

import type { Flight } from "@/lib/airline/types";
import { Badge } from "@/components/airline/ui/badge";
import { formatCurrency } from "@/lib/airline/utils";

export interface FiltersState {
  stops: ("0" | "1" | "2+")[];
  airlineIds: string[];
  maxPrice: number;
  departureWindows: string[];
  arrivalWindows: string[];
  refundableOnly: boolean;
}

export const TIME_WINDOWS = [
  { id: "morning", label: "Morning", hint: "5am – 12pm", range: [5, 12] },
  { id: "afternoon", label: "Afternoon", hint: "12pm – 6pm", range: [12, 18] },
  { id: "evening", label: "Evening", hint: "6pm – 12am", range: [18, 24] },
  { id: "night", label: "Night", hint: "12am – 5am", range: [0, 5] },
] as const;

function stopBucket(stops: number): "0" | "1" | "2+" {
  if (stops === 0) return "0";
  if (stops === 1) return "1";
  return "2+";
}

export function timeWindowOf(hour: number) {
  return TIME_WINDOWS.find((w) => hour >= w.range[0] && hour < w.range[1])?.id ?? "night";
}

export function matchesFilters(flight: Flight, filters: FiltersState) {
  if (filters.stops.length > 0 && !filters.stops.includes(stopBucket(flight.stops))) return false;
  if (filters.airlineIds.length > 0 && !filters.airlineIds.includes(flight.segments[0].airline.id)) return false;
  if (flight.price > filters.maxPrice) return false;
  if (filters.refundableOnly && !flight.refundable) return false;
  const depHour = new Date(flight.segments[0].departureTime).getHours();
  if (filters.departureWindows.length > 0 && !filters.departureWindows.includes(timeWindowOf(depHour))) return false;
  const arrHour = new Date(flight.segments[flight.segments.length - 1].arrivalTime).getHours();
  if (filters.arrivalWindows.length > 0 && !filters.arrivalWindows.includes(timeWindowOf(arrHour))) return false;
  return true;
}

interface FiltersSidebarProps {
  flights: Flight[];
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
  priceCeiling: number;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FiltersSidebar({ flights, filters, onChange, priceCeiling }: FiltersSidebarProps) {
  const airlinesPresent = Array.from(
    new Map(flights.map((f) => [f.segments[0].airline.id, f.segments[0].airline])).values()
  );

  return (
    <div className="space-y-6 rounded-2xl border border-black/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        <button
          className="text-xs font-medium text-brand-600 dark:text-brand-400"
          onClick={() =>
            onChange({ stops: [], airlineIds: [], maxPrice: priceCeiling, departureWindows: [], arrivalWindows: [], refundableOnly: false })
          }
        >
          Reset
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Stops</p>
        <div className="space-y-1.5">
          {(["0", "1", "2+"] as const).map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.stops.includes(s)}
                onChange={() => onChange({ ...filters, stops: toggle(filters.stops, s) })}
                className="h-4 w-4 rounded accent-brand-600"
              />
              {s === "0" ? "Non-stop" : s === "1" ? "1 stop" : "2+ stops"}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Price up to {formatCurrency(filters.maxPrice)}</p>
        <input
          type="range"
          min={0}
          max={priceCeiling}
          step={10}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-brand-600"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Airlines</p>
        <div className="max-h-44 space-y-1.5 overflow-auto pr-1">
          {airlinesPresent.map((airline) => (
            <label key={airline.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.airlineIds.includes(airline.id)}
                onChange={() => onChange({ ...filters, airlineIds: toggle(filters.airlineIds, airline.id) })}
                className="h-4 w-4 rounded accent-brand-600"
              />
              {airline.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Departure time</p>
        <div className="flex flex-wrap gap-1.5">
          {TIME_WINDOWS.map((w) => (
            <button
              key={w.id}
              onClick={() => onChange({ ...filters, departureWindows: toggle(filters.departureWindows, w.id) })}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                filters.departureWindows.includes(w.id)
                  ? "bg-brand-600 text-white"
                  : "bg-black/5 text-foreground/70 dark:bg-white/10"
              }`}
              title={w.hint}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Arrival time</p>
        <div className="flex flex-wrap gap-1.5">
          {TIME_WINDOWS.map((w) => (
            <button
              key={w.id}
              onClick={() => onChange({ ...filters, arrivalWindows: toggle(filters.arrivalWindows, w.id) })}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                filters.arrivalWindows.includes(w.id)
                  ? "bg-brand-600 text-white"
                  : "bg-black/5 text-foreground/70 dark:bg-white/10"
              }`}
              title={w.hint}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={filters.refundableOnly}
          onChange={() => onChange({ ...filters, refundableOnly: !filters.refundableOnly })}
          className="h-4 w-4 rounded accent-brand-600"
        />
        Refundable only
        <Badge tone="green" className="ml-auto">
          {flights.filter((f) => f.refundable).length}
        </Badge>
      </label>
    </div>
  );
}
