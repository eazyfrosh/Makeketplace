"use client";

import { useState } from "react";
import { MapPin, Navigation, PackageCheck } from "lucide-react";
import { formatDateTime } from "@/lib/logistics/format";
import type { TrackingEventLike } from "@/components/logistics/tracking-timeline";

export function RouteMapPlaceholder({
  events,
  origin,
  destination,
  emptyLabel = "No checkpoints yet",
}: {
  events: TrackingEventLike[];
  origin?: { city: string; country: string };
  destination?: { city: string; country: string };
  emptyLabel?: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  const sorted = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const latest = sorted.at(-1);
  const points = sorted.map((e, i) => ({
    x: sorted.length === 1 ? 50 : (i / (sorted.length - 1)) * 100,
    event: e,
    isLast: i === sorted.length - 1,
  }));

  return (
    <div className="space-y-4">
      {(origin || destination) && (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="rounded-xl border border-foreground/10 bg-black/[0.02] p-3.5 dark:bg-white/[0.03]">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/45">From</p>
            <p className="mt-1 font-semibold">{origin ? `${origin.city}, ${origin.country}` : "Origin not provided"}</p>
          </div>
          <Navigation className="mx-auto hidden size-4 text-[var(--carrier-primary)] sm:block" aria-hidden="true" />
          <div className="rounded-xl border border-foreground/10 bg-black/[0.02] p-3.5 sm:text-right dark:bg-white/[0.03]">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/45">To</p>
            <p className="mt-1 font-semibold">{destination ? `${destination.city}, ${destination.country}` : "Destination not provided"}</p>
          </div>
        </div>
      )}

      <div className="relative rounded-xl border border-[color-mix(in_srgb,var(--carrier-primary)_16%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--carrier-primary)_6%,transparent)] to-transparent p-6">
        <div className="bg-grid absolute inset-0 rounded-xl opacity-40" />
        <div className="relative h-28">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2">
            <line x1="0" y1="10" x2="100" y2="10" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1.5 2" className="text-foreground/20" vectorEffect="non-scaling-stroke" />
          </svg>
          {points.length === 0 && (
            <>
              <span className="absolute left-0 top-1/2 size-3.5 -translate-y-1/2 rounded-full border-2 border-[var(--carrier-secondary)] bg-white dark:bg-[#0b0e17]" />
              <span className="absolute right-0 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--carrier-primary)] text-[var(--carrier-on-primary)]">
                <MapPin size={11} />
              </span>
              <p className="absolute inset-x-6 bottom-0 text-center text-xs text-foreground/50">{emptyLabel}. The route will update when a checkpoint is added.</p>
            </>
          )}
          {points.map((p, i) => (
            <button
              key={p.event.id}
              type="button"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${p.x}%` }}
            >
              {p.isLast && (
                <span className="absolute h-5 w-5 rounded-full bg-[color-mix(in_srgb,var(--carrier-primary)_30%,transparent)] animate-pulse-ring" />
              )}
              <span
                className={
                  p.isLast
                    ? "flex h-5 w-5 items-center justify-center rounded-full bg-[var(--carrier-primary)] text-[var(--carrier-on-primary)] shadow-lg shadow-[color-mix(in_srgb,var(--carrier-primary)_40%,transparent)]"
                    : "flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[var(--carrier-secondary)] bg-white dark:bg-[#0b0e17]"
                }
              >
                {p.isLast && <MapPin size={11} />}
              </span>
              {active === i && (
                <div className="absolute bottom-7 z-10 w-48 rounded-lg border border-black/10 bg-white p-2.5 text-left text-xs shadow-xl dark:border-white/10 dark:bg-[#0b0e17]">
                  <p className="font-medium">{p.event.location}</p>
                  <p className="mt-0.5 text-foreground/55">{p.event.description}</p>
                  <p className="mt-1 text-foreground/40">{formatDateTime(p.event.timestamp)}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {latest && (
        <div className="flex items-start gap-3 rounded-xl border border-foreground/10 p-3.5">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--carrier-primary)_12%,transparent)] text-[var(--carrier-primary)]"><PackageCheck size={16} /></span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-foreground/45">Latest checkpoint</p>
            <p className="mt-1 font-semibold">{latest.location}</p>
            <p className="mt-0.5 text-sm text-foreground/60">{latest.description}</p>
            <p className="mt-1 text-xs text-foreground/40">{formatDateTime(latest.timestamp)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
