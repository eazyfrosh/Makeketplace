import Link from "next/link";
import { Ticket } from "lucide-react";
import { SearchWidget } from "@/components/airline/search/search-widget";

export default function AirlineBookingPlatformHome() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700 pb-16 pt-14 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(1.5px_1.5px_at_12%_25%,white,transparent),radial-gradient(1px_1px_at_85%_20%,white,transparent),radial-gradient(1px_1px_at_60%_60%,white,transparent),radial-gradient(1.5px_1.5px_at_30%_75%,white,transparent)]" />
      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">SkyBook</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Book flights worldwide</h1>
        <p className="mx-auto mt-3 max-w-xl text-white/70">
          Search, compare, and book flights across 100+ airlines — all without leaving Nexova.
        </p>
        <div className="mt-4 flex justify-center">
          <Link
            href="/platform/airline-booking-platform/trips"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white"
          >
            <Ticket size={14} /> View my trips
          </Link>
        </div>
      </div>

      <div id="search-widget" className="relative mx-auto mt-8 max-w-5xl px-4 sm:px-6 lg:px-8">
        <SearchWidget />
      </div>
    </div>
  );
}
