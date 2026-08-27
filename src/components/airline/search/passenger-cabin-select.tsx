"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Users } from "lucide-react";
import type { CabinClass, PassengerCounts } from "@/lib/airline/types";
import { cabinLabel } from "@/lib/airline/utils";

const CABINS: CabinClass[] = ["economy", "premium_economy", "business", "first"];

interface Props {
  passengers: PassengerCounts;
  cabin: CabinClass;
  onChange: (passengers: PassengerCounts, cabin: CabinClass) => void;
}

function Counter({
  label,
  hint,
  value,
  min,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-foreground/50">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-black/15 disabled:opacity-30 dark:border-white/20"
        >
          <Minus size={13} />
        </button>
        <span className="w-4 text-center text-sm font-semibold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-black/15 dark:border-white/20"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

export function PassengerCabinSelect({ passengers, cabin, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = passengers.adults + passengers.children + passengers.infants;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground/50">
        Passengers &amp; Cabin
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-black/10 bg-white px-3.5 py-3 text-left transition hover:border-brand-400 dark:border-white/15 dark:bg-white/5"
      >
        <span className="text-brand-600 dark:text-brand-400">
          <Users size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {total} Passenger{total !== 1 ? "s" : ""}
          </span>
          <span className="block truncate text-xs text-foreground/50">{cabinLabel(cabin)}</span>
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-2xl border border-black/10 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-neutral-900">
          <div className="divide-y divide-black/8 dark:divide-white/10">
            <Counter
              label="Adults"
              hint="Age 12+"
              value={passengers.adults}
              min={1}
              onChange={(v) => onChange({ ...passengers, adults: v }, cabin)}
            />
            <Counter
              label="Children"
              hint="Age 2-11"
              value={passengers.children}
              min={0}
              onChange={(v) => onChange({ ...passengers, children: v }, cabin)}
            />
            <Counter
              label="Infants"
              hint="Under 2"
              value={passengers.infants}
              min={0}
              onChange={(v) => onChange({ ...passengers, infants: v }, cabin)}
            />
          </div>
          <div className="mt-3 border-t border-black/8 pt-3 dark:border-white/10">
            <p className="mb-2 text-sm font-medium">Cabin class</p>
            <div className="grid grid-cols-2 gap-2">
              {CABINS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange(passengers, c)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    cabin === c
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                      : "border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                  }`}
                >
                  {cabinLabel(c)}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
