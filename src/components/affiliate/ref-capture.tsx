"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export const AFFILIATE_REF_KEY = "nexova_affiliate_ref";

function RefCaptureInner() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  React.useEffect(() => {
    if (!ref) return;
    const code = ref.trim().toUpperCase();
    if (!code) return;

    // First-touch-per-visit capture; last link clicked wins if someone
    // arrives through two different affiliate links before signing up.
    window.localStorage.setItem(AFFILIATE_REF_KEY, code);

    fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => {});
  }, [ref]);

  return null;
}

/** Mounted once in the root layout so any page carrying `?ref=CODE` is captured, not just the homepage. */
export function RefCapture() {
  return (
    <Suspense fallback={null}>
      <RefCaptureInner />
    </Suspense>
  );
}
