import type { CSSProperties, ReactNode } from "react";
import { getCarrierTheme } from "@/lib/logistics/data/carrier-themes";
import { cn } from "@/lib/utils";

interface CarrierThemeScopeProps {
  carrierCode: string;
  className?: string;
  children: ReactNode;
}

/**
 * Publishes a carrier's theme as CSS custom properties on a wrapper element.
 * Every carrier-aware component reads --carrier-primary/secondary/on-primary/
 * on-secondary (declared with app-default fallbacks in platform-themes.css),
 * so anything themed still renders correctly outside this scope.
 */
export function CarrierThemeScope({ carrierCode, className, children }: CarrierThemeScopeProps) {
  const theme = getCarrierTheme(carrierCode);
  const style = {
    "--carrier-primary": theme.primary,
    "--carrier-secondary": theme.secondary,
    "--carrier-on-primary": theme.onPrimary,
    "--carrier-on-secondary": theme.onSecondary,
  } as CSSProperties;

  return (
    <div data-carrier={carrierCode} className={cn("carrier-theme", className)} style={style}>
      {children}
    </div>
  );
}
