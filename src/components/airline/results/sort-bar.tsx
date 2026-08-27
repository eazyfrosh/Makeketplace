"use client";

export type SortKey = "price" | "duration" | "departure" | "arrival";

const options: { key: SortKey; label: string }[] = [
  { key: "price", label: "Price" },
  { key: "duration", label: "Duration" },
  { key: "departure", label: "Departure" },
  { key: "arrival", label: "Arrival" },
];

export function SortBar({ value, onChange }: { value: SortKey; onChange: (key: SortKey) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-black/8 bg-white p-1.5 dark:border-white/10 dark:bg-white/[0.03]">
      <span className="pl-2 text-xs font-medium uppercase tracking-wide text-foreground/40">Sort</span>
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            value === opt.key
              ? "bg-brand-600 text-white"
              : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
