"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, PackageSearch } from "lucide-react";
import { Button } from "@/components/logistics/ui/button";
import { Input, Label } from "@/components/logistics/ui/input";
import "@/app/platform/platform-themes.css";

export default function TrackShipmentPage() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = trackingNumber.trim().toUpperCase();
    if (!value) return;
    router.push(`/track-shipment/${encodeURIComponent(value)}`);
  }

  return (
    <div className="logistics-theme">
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6 lg:px-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          <PackageSearch size={26} />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Track a shipment</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Enter a TrackNova tracking number to see its current status — no account required.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-black/8 bg-white p-5 text-left dark:border-white/10 dark:bg-white/[0.03]">
          <div>
            <Label>Tracking number</Label>
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
              placeholder="FDX832874928"
              className="uppercase tracking-widest"
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            <Search size={16} /> Track shipment
          </Button>
        </form>
      </div>
    </div>
  );
}
