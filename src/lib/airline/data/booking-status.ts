import type { BadgeTone } from "@/components/airline/ui/badge";
import type { BookingStatus } from "@/lib/airline/types";

export const BOOKING_STATUSES: BookingStatus[] = [
  "confirmed",
  "checked_in",
  "boarding",
  "departed",
  "completed",
  "cancelled",
];

const STATUS_META: Record<BookingStatus, { label: string; tone: BadgeTone }> = {
  confirmed: { label: "Confirmed", tone: "green" },
  checked_in: { label: "Checked In", tone: "brand" },
  boarding: { label: "Boarding", tone: "gold" },
  departed: { label: "Departed", tone: "brand" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "red" },
};

export function bookingStatusLabel(status: BookingStatus): string {
  return STATUS_META[status]?.label ?? status;
}

export function bookingStatusTone(status: BookingStatus): BadgeTone {
  return STATUS_META[status]?.tone ?? "neutral";
}

/** Self-service cancel/rebook only makes sense before travel has started. */
export function canManageBooking(status: BookingStatus): boolean {
  return status === "confirmed" || status === "checked_in";
}
