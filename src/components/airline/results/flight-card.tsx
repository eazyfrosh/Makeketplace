"use client";

import { ArrowRight, Briefcase, CheckCircle2, Luggage, ShieldCheck, Users } from "lucide-react";
import type { Flight } from "@/lib/airline/types";
import { AirlineLogo } from "@/components/airline/ui/airline-logo";
import { Badge } from "@/components/airline/ui/badge";
import { Button } from "@/components/airline/ui/button";
import { findAirport } from "@/lib/airline/data/airports";
import { countryFlag } from "@/lib/airline/data/country-flags";
import { cabinLabel, formatCurrency, formatDuration, formatTime } from "@/lib/airline/utils";

interface FlightCardProps {
  flight: Flight;
  selected?: boolean;
  onSelect: (flight: Flight) => void;
}

export function FlightCard({ flight, selected, onSelect }: FlightCardProps) {
  const first = flight.segments[0];
  const last = flight.segments[flight.segments.length - 1];
  const airline = first.airline;
  const originAirport = findAirport(first.originCode);
  const destinationAirport = findAirport(last.destinationCode);

  return (
    <div
      className={`rounded-2xl border bg-white p-5 transition dark:bg-white/[0.03] ${
        selected
          ? "border-brand-500 ring-2 ring-brand-500/25"
          : "border-black/8 hover:border-black/15 dark:border-white/10 dark:hover:border-white/20"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <AirlineLogo airline={airline} size={36} />
          <div>
            <p className="text-sm font-semibold">{airline.name}</p>
            <p className="text-xs text-foreground/50">
              {flight.segments.map((s) => s.flightNumber).join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="brand">{cabinLabel(flight.cabin)}</Badge>
          {flight.refundable && <Badge tone="green"><ShieldCheck size={11} /> Refundable</Badge>}
          {flight.stops === 0 && <Badge tone="gold">Non-stop</Badge>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="text-center">
            <p className="text-xl font-bold tabular-nums">{formatTime(first.departureTime)}</p>
            <p className="text-xs font-medium text-foreground/50">
              {originAirport && <span aria-hidden>{countryFlag(originAirport.country)} </span>}
              {first.originCode}
            </p>
          </div>

          <div className="flex-1">
            <p className="text-center text-xs text-foreground/50">{formatDuration(flight.totalDurationMinutes)}</p>
            <div className="relative my-1.5 h-px bg-black/15 dark:bg-white/20">
              <ArrowRight size={13} className="absolute -right-1 -top-[7px] text-foreground/40" />
              {flight.stops > 0 &&
                flight.segments.slice(0, -1).map((s, i) => (
                  <span
                    key={i}
                    className="absolute -top-1 h-2 w-2 rounded-full bg-foreground/40"
                    style={{ left: `${((i + 1) / (flight.stops + 1)) * 100}%` }}
                  />
                ))}
            </div>
            <p className="text-center text-xs font-medium text-foreground/60">
              {flight.stops === 0
                ? "Non-stop"
                : `${flight.stops} stop${flight.stops > 1 ? "s" : ""} · ${flight.segments
                    .slice(0, -1)
                    .map((s) => s.destinationCode)
                    .join(", ")}`}
            </p>
          </div>

          <div className="text-center">
            <p className="text-xl font-bold tabular-nums">{formatTime(last.arrivalTime)}</p>
            <p className="text-xs font-medium text-foreground/50">
              {destinationAirport && <span aria-hidden>{countryFlag(destinationAirport.country)} </span>}
              {last.destinationCode}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-black/8 pt-4 sm:border-t-0 sm:border-l sm:pl-5 sm:pt-0 dark:border-white/10">
          <div>
            <p className="text-2xl font-bold text-brand-700 dark:text-brand-400">
              {formatCurrency(flight.price, flight.currency)}
            </p>
            <p className="text-xs text-foreground/50">per passenger</p>
          </div>
          <Button onClick={() => onSelect(flight)} className="shrink-0">
            {selected ? (
              <>
                <CheckCircle2 size={16} /> Selected
              </>
            ) : (
              "Select"
            )}
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-black/8 pt-3 text-xs text-foreground/50 dark:border-white/10">
        <span className="inline-flex items-center gap-1">
          <Luggage size={13} /> {flight.baggageIncluded} checked bag
        </span>
        <span className="inline-flex items-center gap-1">
          <Briefcase size={13} /> {first.aircraft}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users size={13} /> {flight.availableSeats} seat{flight.availableSeats !== 1 ? "s" : ""} left
        </span>
      </div>
    </div>
  );
}
