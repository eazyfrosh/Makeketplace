"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ExtrasSelection,
  Flight,
  FlightSearchParams,
  PassengerInfo,
} from "@/lib/airline/types";

interface BookingState {
  searchParams: FlightSearchParams | null;
  itinerary: Flight[];
  passengers: PassengerInfo[];
  extras: ExtrasSelection;
  rebookingBookingId: string | null;
  setSearchParams: (params: FlightSearchParams) => void;
  setItineraryLeg: (legIndex: number, flight: Flight) => void;
  clearItinerary: () => void;
  setPassengers: (passengers: PassengerInfo[]) => void;
  setExtras: (extras: ExtrasSelection) => void;
  startRebooking: (bookingId: string, passengers: PassengerInfo[], extras: ExtrasSelection) => void;
  reset: () => void;
}

const defaultExtras: ExtrasSelection = {
  extraBaggage: false,
  seatSelection: null,
  meal: null,
  travelInsurance: false,
  priorityBoarding: false,
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      searchParams: null,
      itinerary: [],
      passengers: [],
      extras: defaultExtras,
      rebookingBookingId: null,
      setSearchParams: (params) => set({ searchParams: params }),
      setItineraryLeg: (legIndex, flight) => {
        const itinerary = [...get().itinerary];
        itinerary[legIndex] = flight;
        set({ itinerary });
      },
      clearItinerary: () => set({ itinerary: [] }),
      setPassengers: (passengers) => set({ passengers }),
      setExtras: (extras) => set({ extras }),
      startRebooking: (bookingId, passengers, extras) =>
        set({ rebookingBookingId: bookingId, passengers, extras, itinerary: [] }),
      reset: () =>
        set({
          itinerary: [],
          passengers: [],
          extras: defaultExtras,
          rebookingBookingId: null,
        }),
    }),
    { name: "makeketplace-airline-booking-draft" }
  )
);
