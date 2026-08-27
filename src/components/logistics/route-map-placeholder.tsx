"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { formatDateTime } from "@/lib/logistics/format";
import type { TrackingEventLike } from "@/components/logistics/tracking-timeline";

export function RouteMapPlaceholder({
  events,
  emptyLabel = "No checkpoints yet",
}: {
  events: TrackingEventLike[];
  emptyLabel?: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  if (events.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-black/15 text-sm text-foreground/45 dark:border-white/15">
        {emptyLabel}
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const points = sorted.map((e, i) => ({
    x: sorted.length === 1 ? 50 : (i / (sorted.length - 1)) * 100,
    event: e,
    isLast: i === sorted.length - 1,
  }));

  return (
    <div>
      <div className="relative rounded-xl border border-[color-mix(in_srgb,var(--carrier-primary)_16%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--carrier-primary)_6%,transparent)] to-transparent p-6">
        <div className="bg-grid absolute inset-0 rounded-xl opacity-40" />
        <div className="relative h-28">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2">
            <line x1="0" y1="10" x2="100" y2="10" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1.5 2" className="text-foreground/20" vectorEffect="non-scaling-stroke" />
          </svg>
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
    </div>
  );
}
