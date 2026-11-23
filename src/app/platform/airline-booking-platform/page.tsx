import Link from "next/link";
import { Activity, Ticket } from "lucide-react";
import { SearchWidget } from "@/components/airline/search/search-widget";

export default function AirlineBookingPlatformHome() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-blue-50 pb-16 pt-14 text-slate-950 dark:from-brand-900 dark:via-brand-800 dark:to-brand-700 dark:text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(1.5px_1.5px_at_12%_25%,#0d63d6,transparent),radial-gradient(1px_1px_at_85%_20%,#0d63d6,transparent),radial-gradient(1px_1px_at_60%_60%,#0d63d6,transparent),radial-gradient(1.5px_1.5px_at_30%_75%,#0d63d6,transparent)] dark:opacity-60 dark:[background-image:radial-gradient(1.5px_1.5px_at_12%_25%,white,transparent),radial-gradient(1px_1px_at_85%_20%,white,transparent),radial-gradient(1px_1px_at_60%_60%,white,transparent),radial-gradient(1.5px_1.5px_at_30%_75%,white,transparent)]" />
      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700 dark:text-white/70">SkyBook</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Book flights worldwide</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-white/80">
          Search, compare, and book flights across 100+ airlines — all without leaving EazyTool.
        </p>
        <div className="mt-4 flex justify-center">
          <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/platform/airline-booking-platform/trips"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-900 dark:text-white/80 dark:hover:text-white"
          >
            <Ticket size={14} /> View my trips
          </Link>
          <Link href="/platform/airline-booking-platform/flight-status" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-900 dark:text-white/80 dark:hover:text-white"><Activity size={14} /> Flight status</Link>
          <a href="http://skybookinc.app/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-900 dark:text-white/80 dark:hover:text-white">Visit official SkyBook website</a>
          </div>
        </div>
      </div>

      <div id="search-widget" className="relative mx-auto mt-8 max-w-5xl px-4 sm:px-6 lg:px-8">
        <SearchWidget />
      </div>
    </div>
  );
}
