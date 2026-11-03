import type { SubscriptionBillingCycle } from "@/types/subscriptions";

export function addBillingPeriod(date: Date, cycle: SubscriptionBillingCycle): Date {
  const next = new Date(date);
  const day = next.getUTCDate();
  next.setUTCDate(1);
  if (cycle === "yearly") next.setUTCFullYear(next.getUTCFullYear() + 1);
  else next.setUTCMonth(next.getUTCMonth() + (cycle === "six_months" ? 6 : 1));
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
}

export function paidPeriodExpiry(
  paidAt: string | null,
  currentExpiry: string | null | undefined,
  cycle: SubscriptionBillingCycle,
): string {
  const paid = new Date(paidAt ?? Date.now());
  const current = currentExpiry ? new Date(currentExpiry) : null;
  const start = current && Number.isFinite(current.getTime()) && current.getTime() > paid.getTime() ? current : paid;
  return addBillingPeriod(start, cycle).toISOString();
}
