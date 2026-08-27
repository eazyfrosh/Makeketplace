"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, X } from "lucide-react";
import { useBookingStore } from "@/lib/airline/store/booking-store";
import { getBooking } from "@/lib/airline/services/bookings";

export function RebookingBanner() {
  const router = useRouter();
  const rebookingBookingId = useBookingStore((s) => s.rebookingBookingId);
  const reset = useBookingStore((s) => s.reset);
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    if (!rebookingBookingId) {
      setReference(null);
      return;
    }
    getBooking(rebookingBookingId).then((b) => setReference(b?.bookingReference ?? null));
  }, [rebookingBookingId]);

  if (!rebookingBookingId) return null;

  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm">
      <span className="flex items-center gap-2 text-foreground/80">
        <CalendarClock size={16} className="text-gold-500" />
        Choosing a new flight for booking <strong>{reference ?? rebookingBookingId}</strong> — the new flight will replace the original.
      </span>
      <button
        onClick={() => {
          reset();
          router.push("/platform/airline-booking-platform/trips");
        }}
        className="flex shrink-0 items-center gap-1 text-xs font-medium text-foreground/50 hover:text-foreground"
      >
        <X size={13} /> Cancel
      </button>
    </div>
  );
}
