"use client";

import { useEffect, useState } from "react";
import type { Airline } from "@/lib/airline/types";
import { findAirline } from "@/lib/airline/data/airlines";
import { cn } from "@/lib/utils";

function shadeColor(hex: string, percent: number) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

type LoadState = "loading" | "loaded" | "error";

const logoCache = new Map<string, "loaded" | "error">();
const logoListeners = new Map<string, Set<(result: "loaded" | "error") => void>>();

function loadLogo(src: string, onSettle: (result: "loaded" | "error") => void) {
  const cached = logoCache.get(src);
  if (cached) {
    onSettle(cached);
    return () => {};
  }

  let listeners = logoListeners.get(src);
  if (!listeners) {
    listeners = new Set();
    logoListeners.set(src, listeners);
    const img = new window.Image();
    img.decoding = "async";
    const settle = (result: "loaded" | "error") => {
      logoCache.set(src, result);
      for (const listener of listeners!) listener(result);
      logoListeners.delete(src);
    };
    img.onload = () => settle("loaded");
    img.onerror = () => settle("error");
    img.src = src;
  }
  listeners.add(onSettle);
  return () => listeners!.delete(onSettle);
}

export function AirlineLogo({ airline, size = 40, className }: { airline: Airline; size?: number; className?: string }) {
  const current = findAirline(airline.id) ?? airline;
  const [state, setState] = useState<LoadState>(() => {
    if (!current.logoSrc) return "error";
    return logoCache.get(current.logoSrc) ?? "loading";
  });

  useEffect(() => {
    if (!current.logoSrc) {
      setState("error");
      return;
    }
    setState(logoCache.get(current.logoSrc) ?? "loading");
    return loadLogo(current.logoSrc, setState);
  }, [current.logoSrc]);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/10 dark:ring-white/15",
        className
      )}
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden={state === "loaded"}
        className="absolute inset-0 flex items-center justify-center font-bold text-white transition-opacity duration-200"
        style={{
          background: `linear-gradient(135deg, ${current.logoColor}, ${shadeColor(current.logoColor, -22)})`,
          fontSize: size * 0.34,
          letterSpacing: "0.02em",
          opacity: state === "loaded" ? 0 : 1,
        }}
      >
        {current.code}
      </span>
      {current.logoSrc && state === "loaded" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current.logoSrc}
          alt={`${current.name} logo`}
          className="relative h-[78%] w-[78%] object-contain"
          decoding="async"
        />
      )}
    </span>
  );
}
