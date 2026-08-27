import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { key: "passengers", label: "Passengers" },
  { key: "extras", label: "Extras" },
  { key: "confirmation", label: "Confirmation" },
];

export function BookingSteps({ current }: { current: "passengers" | "extras" | "confirmation" }) {
  const currentIdx = steps.findIndex((s) => s.key === current);
  return (
    <div className="mx-auto mb-8 flex max-w-2xl items-center">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition",
                idx < currentIdx
                  ? "border-brand-600 bg-brand-600 text-white"
                  : idx === currentIdx
                  ? "border-brand-600 text-brand-600 dark:text-brand-400"
                  : "border-black/15 text-foreground/30 dark:border-white/20"
              )}
            >
              {idx < currentIdx ? <Check size={14} /> : idx + 1}
            </div>
            <span
              className={cn(
                "hidden text-xs font-medium sm:block",
                idx <= currentIdx ? "text-foreground" : "text-foreground/40"
              )}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={cn("mx-2 h-0.5 flex-1", idx < currentIdx ? "bg-brand-600" : "bg-black/10 dark:bg-white/15")} />
          )}
        </div>
      ))}
    </div>
  );
}
