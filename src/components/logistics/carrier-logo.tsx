"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getCarrier } from "@/lib/logistics/data/carriers";
import { getCarrierLogoSrc, DEFAULT_CARRIER_LOGO } from "@/lib/logistics/data/carrier-logos";

interface CarrierLogoProps {
  /** Carrier code (preferred, e.g. shipment.carrierCode) or display name. */
  carrier: string;
  /** Visual height in px; width follows automatically to preserve aspect ratio. Default 36. */
  size?: number;
  /** Drop the neutral background chip for dense/inline contexts (tables, chips). */
  bare?: boolean;
  className?: string;
}

/**
 * Renders a carrier's logo from /public/carriers, resolved by carrier code
 * or name, with automatic fallback to default.svg if no logo is mapped or
 * the file fails to load. All logos here are SVG, so this always renders a
 * plain <img> — no next/image raster optimization is needed.
 */
export function CarrierLogo({ carrier, size = 36, bare = false, className }: CarrierLogoProps) {
  const def = getCarrier(carrier);
  const resolvedSrc = getCarrierLogoSrc(def.code);
  const [src, setSrc] = useState(resolvedSrc);

  useEffect(() => setSrc(resolvedSrc), [resolvedSrc]);

  const innerHeight = bare ? size : Math.max(12, size - 12);
  const alt = `${def.name} logo`;

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="w-auto object-contain"
      style={{ height: innerHeight }}
      onError={() => setSrc(DEFAULT_CARRIER_LOGO)}
    />
  );

  if (bare) {
    return (
      <span className={cn("inline-flex shrink-0 items-center", className)} style={{ height: size }}>
        {image}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-white p-1.5 ring-1 ring-black/5",
        className
      )}
      style={{ height: size }}
    >
      {image}
    </span>
  );
}
