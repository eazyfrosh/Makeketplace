"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlaneTakeoff, Ticket, User } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { getUserBookings, cancelBooking } from "@/lib/airline/services/bookings";
import { BookingCard } from "@/components/airline/booking/booking-card";
import { Button } from "@/components/airline/ui/button";
import { LoadingState } from "@/components/airline/ui/loading-state";
import { EmptyState } from "@/components/airline/ui/empty-state";
import { startRebooking } from "@/lib/airline/rebooking";
import type { Booking } from "@/lib/airline/types";

type Tab = "upcoming" | "past" | "cancelled";

export default function MyTripsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [fetching, setFetching] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    const list = await getUserBookings(user.uid);
    setBookings(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setFetching(false);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login?next=/platform/airline-booking-platform/trips");
      return;
    }
    load();
  }, [loading, user, router, load]);

  if (loading || !user) return null;

  const now = Date.now();
  const upcoming = bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      b.status !== "completed" &&
      b.status !== "departed" &&
      new Date(b.flights[0].segments[0].departureTime).getTime() >= now
  );
  const past = bookings.filter(
    (b) =>
      b.status === "departed" ||
      b.status === "completed" ||
      (b.status !== "cancelled" && new Date(b.flights[0].segments[0].departureTime).getTime() < now)
  );
  const cancelled = bookings.filter((b) => b.status === "cancelled");

  const shown = tab === "upcoming" ? upcoming : tab === "past" ? past : cancelled;

  async function handleCancel(booking: Booking) {
    await cancelBooking(booking);
    toast.success(`Booking ${booking.bookingReference} cancelled`);
    load();
  }

  function handleRebook(booking: Booking) {
    router.push(startRebooking(booking));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Trips</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Welcome back, {user.name || "traveler"} — manage your bookings
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/profile">
            <Button variant="outline"><User size={15} /> Profile</Button>
          </Link>
          <Link href="/platform/airline-booking-platform#search-widget">
            <Button><PlaneTakeoff size={15} /> Book a flight</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-black/8 dark:border-white/10">
        {([
          { key: "upcoming", label: `Upcoming (${upcoming.length})` },
          { key: "past", label: `Past (${past.length})` },
          { key: "cancelled", label: `Cancelled (${cancelled.length})` },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              tab === t.key
                ? "border-brand-600 text-brand-600 dark:text-brand-400"
                : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {fetching ? (
        <LoadingState label="Loading your bookings…" />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<Ticket size={22} />}
          title={`No ${tab} trips yet`}
          description={
            tab === "upcoming"
              ? "Once you book a flight, it'll show up here."
              : tab === "past"
              ? "Trips you've completed will appear here."
              : "Bookings you've cancelled will appear here."
          }
          action={
            tab === "upcoming" ? (
              <Link href="/platform/airline-booking-platform#search-widget">
                <Button>
                  <PlaneTakeoff size={15} /> Search flights
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {shown.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={tab === "upcoming" ? handleCancel : undefined}
              onRebook={tab === "upcoming" ? handleRebook : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
