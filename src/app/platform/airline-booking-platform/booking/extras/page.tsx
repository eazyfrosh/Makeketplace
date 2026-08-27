"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Luggage, Shield, Sparkles, Utensils } from "lucide-react";
import { BookingSteps } from "@/components/airline/booking/booking-steps";
import { TripSummary } from "@/components/airline/booking/trip-summary";
import { SeatMap } from "@/components/airline/booking/seat-map";
import { RebookingBanner } from "@/components/airline/booking/rebooking-banner";
import { Button } from "@/components/airline/ui/button";
import { Select } from "@/components/airline/ui/input";
import { useBookingStore } from "@/lib/airline/store/booking-store";
import { useBookingHydrated } from "@/lib/airline/store/use-hydrated";
import { useAuth } from "@/context/auth-context";
import { createBooking, getBooking, updateBooking } from "@/lib/airline/services/bookings";
import { MEAL_OPTIONS } from "@/lib/airline/data/flights";
import { EXTRA_BAGGAGE_PRICE, INSURANCE_PRICE, PRIORITY_PRICE, computeExtrasTotal } from "@/lib/airline/data/extras-pricing";
import { formatCurrency, generateBookingReference, generateVerificationToken } from "@/lib/airline/utils";
import type { Booking } from "@/lib/airline/types";

export default function ExtrasPage() {
  const hydrated = useBookingHydrated();
  if (!hydrated) return null;
  return <ExtrasForm />;
}

function ExtrasForm() {
  const router = useRouter();
  const { itinerary, extras, setExtras, passengers, searchParams, rebookingBookingId, reset } = useBookingStore();
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (itinerary.filter(Boolean).length === 0) router.replace("/platform/airline-booking-platform#search-widget");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extrasTotal = computeExtrasTotal(extras);

  async function handleConfirm() {
    if (!user) {
      router.push("/auth/login?next=/platform/airline-booking-platform/booking/extras");
      return;
    }

    setConfirming(true);
    await new Promise((resolve) => setTimeout(resolve, 900));

    const passengerCount = searchParams
      ? searchParams.passengers.adults + searchParams.passengers.children + searchParams.passengers.infants
      : passengers.length || 1;
    const ticketPrice = itinerary.reduce((sum, f) => sum + (f ? f.price : 0), 0) * Math.max(1, passengerCount);

    if (rebookingBookingId) {
      const existing = await getBooking(rebookingBookingId);
      if (!existing) {
        setConfirming(false);
        toast.error("The original booking could not be found.");
        return;
      }
      const rebooked: Booking = {
        ...existing,
        flights: itinerary.filter(Boolean),
        passengers,
        extras,
        ticketPrice,
        totalPrice: ticketPrice + extrasTotal,
        status: "confirmed",
        rebookedAt: new Date().toISOString(),
        seatAssignment: extras.seatSelection,
      };
      await updateBooking(rebooked);
      setConfirming(false);
      reset();
      toast.success("Booking rebooked successfully!");
      router.push(`/platform/airline-booking-platform/booking/confirmation/${rebooked.id}`);
      return;
    }

    const booking: Booking = {
      id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      bookingReference: generateBookingReference(),
      verificationToken: generateVerificationToken(),
      userId: user.uid,
      flights: itinerary.filter(Boolean),
      passengers,
      extras,
      ticketPrice,
      totalPrice: ticketPrice + extrasTotal,
      currency: "USD",
      status: "confirmed",
      createdAt: new Date().toISOString(),
      seatAssignment: extras.seatSelection,
    };

    await createBooking(booking);
    setConfirming(false);
    reset();
    toast.success("Booking confirmed!");
    router.push(`/platform/airline-booking-platform/booking/confirmation/${booking.id}`);
  }

  if (itinerary.filter(Boolean).length === 0) return null;
  const primaryFlight = itinerary[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <BookingSteps current="extras" />
      <RebookingBanner />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Enhance your trip</h1>
            <p className="mt-1 text-sm text-foreground/60">Optional extras, priced per trip.</p>
          </div>

          <section className="rounded-2xl border border-black/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={17} className="text-brand-600 dark:text-brand-400" />
              <h2 className="font-semibold">Select your seat</h2>
            </div>
            {primaryFlight && (
              <SeatMap
                flightId={primaryFlight.id}
                value={extras.seatSelection}
                onChange={(seat) => setExtras({ ...extras, seatSelection: seat })}
              />
            )}
          </section>

          <section className="rounded-2xl border border-black/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="mb-4 flex items-center gap-2">
              <Utensils size={17} className="text-brand-600 dark:text-brand-400" />
              <h2 className="font-semibold">Meal preference</h2>
            </div>
            <Select
              value={extras.meal ?? "none"}
              onChange={(e) => setExtras({ ...extras, meal: e.target.value === "none" ? null : e.target.value })}
            >
              {MEAL_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m === "none" ? "No preference" : m}
                </option>
              ))}
            </Select>
          </section>

          <section className="space-y-3 rounded-2xl border border-black/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-black/[0.02] p-3.5 dark:bg-white/5">
              <span className="flex items-center gap-3">
                <Luggage size={18} className="text-brand-600 dark:text-brand-400" />
                <span>
                  <span className="block text-sm font-medium">Extra checked baggage</span>
                  <span className="block text-xs text-foreground/50">+23kg additional allowance</span>
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-sm font-semibold">{formatCurrency(EXTRA_BAGGAGE_PRICE)}</span>
                <input
                  type="checkbox"
                  checked={extras.extraBaggage}
                  onChange={(e) => setExtras({ ...extras, extraBaggage: e.target.checked })}
                  className="h-5 w-5 rounded accent-brand-600"
                />
              </span>
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-black/[0.02] p-3.5 dark:bg-white/5">
              <span className="flex items-center gap-3">
                <Shield size={18} className="text-brand-600 dark:text-brand-400" />
                <span>
                  <span className="block text-sm font-medium">Travel insurance</span>
                  <span className="block text-xs text-foreground/50">Trip cancellation & medical coverage (mock)</span>
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-sm font-semibold">{formatCurrency(INSURANCE_PRICE)}</span>
                <input
                  type="checkbox"
                  checked={extras.travelInsurance}
                  onChange={(e) => setExtras({ ...extras, travelInsurance: e.target.checked })}
                  className="h-5 w-5 rounded accent-brand-600"
                />
              </span>
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-black/[0.02] p-3.5 dark:bg-white/5">
              <span className="flex items-center gap-3">
                <Sparkles size={18} className="text-brand-600 dark:text-brand-400" />
                <span>
                  <span className="block text-sm font-medium">Priority boarding</span>
                  <span className="block text-xs text-foreground/50">Board first, skip the line</span>
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-sm font-semibold">{formatCurrency(PRIORITY_PRICE)}</span>
                <input
                  type="checkbox"
                  checked={extras.priorityBoarding}
                  onChange={(e) => setExtras({ ...extras, priorityBoarding: e.target.checked })}
                  className="h-5 w-5 rounded accent-brand-600"
                />
              </span>
            </label>
          </section>

          <div className="flex justify-end">
            <Button size="lg" onClick={handleConfirm} disabled={confirming}>
              {confirming ? (
                rebookingBookingId ? "Rebooking…" : "Confirming booking…"
              ) : (
                <>
                  <CheckCircle2 size={17} /> {rebookingBookingId ? "Confirm rebooking" : "Confirm booking"}
                </>
              )}
            </Button>
          </div>
        </div>

        <div>
          <TripSummary extrasTotal={extrasTotal} />
        </div>
      </div>
    </div>
  );
}
