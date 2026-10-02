"use client";

import { useState } from "react";
import { CalendarDays, Clock3, MapPin, PlaneTakeoff, Search } from "lucide-react";
import { Card, CardContent } from "@/components/airline/ui/card";
import { Badge } from "@/components/airline/ui/badge";
import { Button } from "@/components/airline/ui/button";
import { Input, Label } from "@/components/airline/ui/input";
import { AirlineLogo } from "@/components/airline/ui/airline-logo";
import { findAirport } from "@/lib/airline/data/airports";
import { bookingStatusLabel, bookingStatusTone } from "@/lib/airline/data/booking-status";
import { findBookingStatusByReference } from "@/lib/airline/services/bookings";
import { cabinLabel, formatDateLong, formatTime } from "@/lib/airline/utils";
import type { BookingStatusSummary } from "@/lib/airline/types";

export default function FlightStatusPage() {
  const [bookingReference, setBookingReference] = useState("");
  const [result, setResult] = useState<BookingStatusSummary | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    const reference = bookingReference.trim().toUpperCase();
    if (!/^[A-Z0-9-]{4,32}$/.test(reference)) {
      setError("Enter a valid booking number.");
      setResult(undefined);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setResult(await findBookingStatusByReference(reference));
    } catch {
      setResult(undefined);
      setError("Flight status could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-7 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          <PlaneTakeoff size={23} />
        </span>
        <h1 className="mt-3 text-2xl font-bold">Track your flight itinerary</h1>
        <p className="mt-1 text-sm text-foreground/60">Paste your booking number to see its current status, route, date, and times.</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="booking-reference">Booking number</Label>
              <Input
                id="booking-reference"
                value={bookingReference}
                onChange={(event) => setBookingReference(event.target.value.toUpperCase())}
                onKeyDown={(event) => { if (event.key === "Enter") void handleSearch(); }}
                placeholder="e.g. AB12CD"
                autoComplete="off"
                maxLength={32}
              />
            </div>
            <Button onClick={() => void handleSearch()} disabled={loading}>
              <Search size={16} /> {loading ? "Checking…" : "Track itinerary"}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </CardContent>
      </Card>

      {result === null && (
        <Card className="mt-6">
          <CardContent className="p-8 text-center">
            <p className="font-semibold">Booking not found</p>
            <p className="mt-1 text-sm text-foreground/55">Check the booking number and try again.</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">Booking number</p>
                <p className="font-mono text-2xl font-bold tracking-widest text-brand-700 dark:text-brand-300">{result.bookingReference}</p>
              </div>
              <Badge tone={bookingStatusTone(result.status)} className="capitalize">{bookingStatusLabel(result.status)}</Badge>
            </CardContent>
          </Card>

          {result.flights.map((flight, flightIndex) => {
            const first = flight.segments[0];
            const last = flight.segments[flight.segments.length - 1];
            return (
              <Card key={flight.id}>
                <CardContent className="p-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/8 px-5 py-4 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <AirlineLogo airline={first.airline} size={34} />
                      <div>
                        <p className="font-semibold">{flightIndex === 0 ? "Outbound itinerary" : flightIndex === 1 ? "Return itinerary" : `Flight ${flightIndex + 1}`}</p>
                        <p className="text-xs text-foreground/50">{first.airline.name} · {cabinLabel(flight.cabin)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-foreground/60">
                      <CalendarDays size={15} /> {formatDateLong(first.departureTime)}
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    {flight.segments.map((segment) => {
                      const origin = findAirport(segment.originCode);
                      const destination = findAirport(segment.destinationCode);
                      return (
                        <div key={segment.id} className="rounded-xl border border-black/8 p-4 dark:border-white/10">
                          <div className="mb-4 flex items-center justify-between text-xs text-foreground/50">
                            <span>{segment.airline.name} {segment.flightNumber}</span>
                            <span>{segment.aircraft}</span>
                          </div>
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                            <div>
                              <p className="text-2xl font-bold">{formatTime(segment.departureTime)}</p>
                              <p className="font-semibold text-brand-700 dark:text-brand-300">{segment.originCode}</p>
                              <p className="text-xs text-foreground/50">{origin?.city ?? segment.originCode}</p>
                            </div>
                            <div className="flex items-center text-foreground/30">
                              <span className="hidden h-px w-10 bg-current sm:block" />
                              <PlaneTakeoff className="mx-2" size={18} />
                              <span className="hidden h-px w-10 bg-current sm:block" />
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">{formatTime(segment.arrivalTime)}</p>
                              <p className="font-semibold text-brand-700 dark:text-brand-300">{segment.destinationCode}</p>
                              <p className="text-xs text-foreground/50">{destination?.city ?? segment.destinationCode}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
                      <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> Departs {formatTime(first.departureTime)} · Arrives {formatTime(last.arrivalTime)}</span>
                      {(result.terminal || result.gate) && (
                        <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {result.terminal ? `Terminal ${result.terminal}` : ""}{result.terminal && result.gate ? " · " : ""}{result.gate ? `Gate ${result.gate}` : ""}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
