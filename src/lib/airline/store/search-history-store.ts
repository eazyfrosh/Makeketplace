"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RecentSearch } from "@/lib/airline/types";

interface SearchHistoryState {
  recentSearches: RecentSearch[];
  favoriteDestinations: string[];
  addSearch: (search: RecentSearch) => void;
  toggleFavorite: (airportCode: string) => void;
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      recentSearches: [],
      favoriteDestinations: [],
      addSearch: (search) => {
        const existing = get().recentSearches.filter(
          (s) => !(s.from === search.from && s.to === search.to)
        );
        set({ recentSearches: [search, ...existing].slice(0, 6) });
      },
      toggleFavorite: (airportCode) => {
        const current = get().favoriteDestinations;
        set({
          favoriteDestinations: current.includes(airportCode)
            ? current.filter((c) => c !== airportCode)
            : [...current, airportCode].slice(0, 12),
        });
      },
    }),
    { name: "makeketplace-airline-search-history" }
  )
);
