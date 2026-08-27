import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type BadgeTone = "brand" | "gold" | "green" | "red" | "neutral";
type Tone = BadgeTone;

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300",
  gold: "bg-gold-500/15 text-gold-500 dark:text-gold-400",
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  neutral: "bg-black/5 text-foreground/70 dark:bg-white/10 dark:text-foreground/70",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
