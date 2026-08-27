import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({
  label = "Loading…",
  className,
  carrier = false,
}: {
  label?: string;
  className?: string;
  carrier?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-4 py-24 text-center", className)}>
      <Loader2
        size={26}
        className={cn("animate-spin", carrier ? "text-[var(--carrier-primary-text)]" : "text-brand-600 dark:text-brand-400")}
      />
      <p className="text-sm text-foreground/50">{label}</p>
    </div>
  );
}
