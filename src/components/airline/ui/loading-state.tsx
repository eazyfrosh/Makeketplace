import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-4 py-24 text-center", className)}>
      <Loader2 size={26} className="animate-spin text-brand-600 dark:text-brand-400" />
      <p className="text-sm text-foreground/50">{label}</p>
    </div>
  );
}
