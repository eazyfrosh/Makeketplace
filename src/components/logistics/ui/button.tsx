import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "gold" | "carrier" | "carrier-outline";
type Size = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/25 dark:bg-brand-500 dark:hover:bg-brand-600",
  secondary:
    "bg-black/5 text-foreground hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15",
  outline:
    "border border-black/15 text-foreground hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10",
  ghost: "text-foreground hover:bg-black/5 dark:hover:bg-white/10",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20",
  gold: "bg-gold-500 text-black hover:bg-gold-400 shadow-lg shadow-gold-500/25 font-semibold",
  carrier:
    "bg-[var(--carrier-primary)] text-[var(--carrier-on-primary)] hover:brightness-110 shadow-lg shadow-[color-mix(in_srgb,var(--carrier-primary)_35%,transparent)]",
  "carrier-outline":
    "border border-[color-mix(in_srgb,var(--carrier-primary)_45%,transparent)] text-[var(--carrier-primary-text)] hover:bg-[color-mix(in_srgb,var(--carrier-primary)_10%,transparent)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3.5 text-base rounded-2xl",
  icon: "h-9 w-9 rounded-full p-0",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "LogisticsButton";
