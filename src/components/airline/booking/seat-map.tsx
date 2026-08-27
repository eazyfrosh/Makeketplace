"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { hashString } from "@/lib/airline/utils";

const COLUMNS = ["A", "B", "C", "D", "E", "F"];
const ROWS = 12;

export function SeatMap({
  flightId,
  value,
  onChange,
}: {
  flightId: string;
  value: string | null;
  onChange: (seat: string) => void;
}) {
  const unavailable = useMemo(() => {
    const set = new Set<string>();
    for (let row = 1; row <= ROWS; row++) {
      for (const col of COLUMNS) {
        const seat = `${row}${col}`;
        const h = hashString(`${flightId}-${seat}`);
        if (h % 100 < 18) set.add(seat);
      }
    }
    return set;
  }, [flightId]);

  return (
    <div className="rounded-xl border border-black/8 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-center gap-4 text-xs text-foreground/60">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-white border border-black/20 dark:bg-white/10 dark:border-white/20" /> Available</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-gold-500/70" /> Extra legroom</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-brand-600" /> Selected</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-black/20 dark:bg-white/20" /> Taken</span>
      </div>
      <div className="min-w-fit space-y-1.5 overflow-x-auto">
        <div className="flex items-center gap-1.5 pl-5">
          {COLUMNS.map((col, ci) => (
            <span key={col} className={cn("w-7 text-center text-[10px] font-semibold text-foreground/40", ci === 3 && "ml-4")}>
              {col}
            </span>
          ))}
        </div>
        {Array.from({ length: ROWS }).map((_, i) => {
          const row = i + 1;
          return (
            <div key={row} className="flex items-center gap-1.5">
              <span className="w-5 text-xs text-foreground/40">{row}</span>
              {COLUMNS.map((col, ci) => {
                const seat = `${row}${col}`;
                const taken = unavailable.has(seat);
                const selected = value === seat;
                const legroom = row <= 2;
                return (
                  <button
                    key={seat}
                    type="button"
                    disabled={taken}
                    onClick={() => onChange(seat)}
                    aria-label={`Seat ${seat}${taken ? " (unavailable)" : ""}`}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded text-[10px] font-medium transition",
                      ci === 3 && "ml-4",
                      taken && "cursor-not-allowed bg-black/20 text-transparent dark:bg-white/20",
                      !taken && selected && "bg-brand-600 text-white",
                      !taken && !selected && legroom && "bg-gold-500/70 text-black hover:bg-gold-500",
                      !taken && !selected && !legroom && "border border-black/15 bg-white hover:border-brand-400 dark:border-white/20 dark:bg-white/10"
                    )}
                  >
                    {col}
                  </button>
                );
              })}
              {row === 2 && (
                <span className="ml-2 text-[10px] uppercase tracking-wide text-foreground/30">Exit row</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
