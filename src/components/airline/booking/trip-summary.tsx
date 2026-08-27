"use client";

import { Plane } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/airline/ui/card";
import { useBookingStore } from "@/lib/airline/store/booking-store";
import { formatCurrency, formatDateShort, formatDuration, formatTime } from "@/lib/airline/utils";

export function TripSummary({ extrasTotal = 0 }: { extrasTotal?: number }) {
  const { itinerary, searchParams } = useBookingStore();
  const passengerCount = searchParams
    ? searchParams.passengers.adults + searchParams.passengers.children + searchParams.passengers.infants
    : 1;
  const flightsTotal = itinerary.reduce((sum, f) => sum + (f ? f.price : 0), 0) * Math.max(1, passengerCount);
  const grandTotal = flightsTotal + extrasTotal;

  return (
    <Card className="sticky top-24">
      <CardHeader className="flex items-center gap-2 pb-3">
        <Plane size={16} className="text-brand-600 dark:text-brand-400" />
        <h3 className="font-semibold">Trip summary</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {itinerary.filter(Boolean).map((flight, idx) => {
          const first = flight.segments[0];
          const last = flight.segments[flight.segments.length - 1];
          return (
            <div key={idx} className="rounded-xl bg-black/[0.02] p-3 text-sm dark:bg-white/5">
              <p className="font-medium">
                {first.originCode} → {last.destinationCode}
              </p>
              <p className="mt-0.5 text-xs text-foreground/60">
                {formatDateShort(first.departureTime)} · {formatTime(first.departureTime)} – {formatTime(last.arrivalTime)}
              </p>
              <p className="text-xs text-foreground/50">{formatDuration(flight.totalDurationMinutes)} · {first.airline.name}</p>
              <p className="mt-1 text-sm font-semibold text-brand-700 dark:text-brand-400">
                {formatCurrency(flight.price)} <span className="text-xs font-normal text-foreground/50">/ passenger</span>
              </p>
            </div>
          );
        })}

        <div className="space-y-1.5 border-t border-black/8 pt-3 text-sm dark:border-white/10">
          <div className="flex justify-between text-foreground/60">
            <span>Passengers</span>
            <span>{passengerCount}</span>
          </div>
          <div className="flex justify-between text-foreground/60">
            <span>Ticket price</span>
            <span>{formatCurrency(flightsTotal)}</span>
          </div>
          {extrasTotal > 0 && (
            <div className="flex justify-between text-foreground/60">
              <span>Extras</span>
              <span>{formatCurrency(extrasTotal)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-black/8 pt-1.5 text-base font-bold dark:border-white/10">
            <span>Total</span>
            <span className="text-brand-700 dark:text-brand-400">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
