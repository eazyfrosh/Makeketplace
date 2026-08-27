"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QRCodeImage({ value, size = 160 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size * 2, margin: 1, color: { dark: "#0b1220", light: "#ffffff" } })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return <div style={{ width: size, height: size }} className="animate-pulse rounded-lg bg-black/10 dark:bg-white/10" />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt="Shipment QR code" width={size} height={size} className="rounded-lg" />;
}
