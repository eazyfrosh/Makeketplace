import { Suspense } from "react";
import { SearchResultsClient } from "./search-results-client";
import { FlightCardSkeleton } from "@/components/airline/ui/skeleton";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <FlightCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <SearchResultsClient />
    </Suspense>
  );
}
