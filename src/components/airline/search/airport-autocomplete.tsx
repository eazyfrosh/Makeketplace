"use client";

import { useEffect, useRef, useState } from "react";
import { PlaneLanding, PlaneTakeoff } from "lucide-react";
import { searchAirports, findAirport } from "@/lib/airline/data/airports";
import { countryFlag } from "@/lib/airline/data/country-flags";
import { cn } from "@/lib/utils";

interface AirportAutocompleteProps {
  label: string;
  value: string;
  onChange: (code: string) => void;
  icon?: "from" | "to";
  placeholder?: string;
  openOnMount?: boolean;
}

export function AirportAutocomplete({ label, value, onChange, icon = "from", placeholder, openOnMount = false }: AirportAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(openOnMount);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = findAirport(value);
  const results = searchAirports(query);

  useEffect(() => {
    if (openOnMount) setOpen(true);
  }, [openOnMount]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground/50">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-black/10 bg-white px-3.5 py-3 text-left transition hover:border-brand-400 dark:border-white/15 dark:bg-white/5"
      >
        <span className="text-brand-600 dark:text-brand-400">
          {icon === "from" ? <PlaneTakeoff size={18} /> : <PlaneLanding size={18} />}
        </span>
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block truncate text-sm font-semibold">
                <span aria-hidden className="mr-1">{countryFlag(selected.country)}</span>
                {selected.city} ({selected.code})
              </span>
              <span className="block truncate text-xs text-foreground/50">{selected.name}</span>
            </>
          ) : (
            <span className="text-sm text-foreground/40">{placeholder ?? "Select airport"}</span>
          )}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-auto rounded-2xl border border-black/10 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-neutral-900">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city, airport, or code"
            className="mb-2 w-full rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5"
          />
          <div className="flex flex-col">
            {results.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-foreground/40">No airports found</p>
            )}
            {results.map((airport) => (
              <button
                key={airport.code}
                type="button"
                onClick={() => {
                  onChange(airport.code);
                  setQuery("");
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-brand-50 dark:hover:bg-white/10",
                  airport.code === value && "bg-brand-50 dark:bg-white/10"
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    <span aria-hidden className="mr-1">{countryFlag(airport.country)}</span>
                    {airport.city}, {airport.country}
                  </span>
                  <span className="block truncate text-xs text-foreground/50">{airport.name}</span>
                </span>
                <span className="shrink-0 rounded-md bg-black/5 px-2 py-0.5 font-mono text-xs font-semibold dark:bg-white/10">
                  {airport.code}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
