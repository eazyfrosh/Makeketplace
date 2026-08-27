import type { ExtrasSelection } from "@/lib/airline/types";

export const EXTRA_BAGGAGE_PRICE = 45;
export const INSURANCE_PRICE = 29;
export const PRIORITY_PRICE = 19;

export function computeExtrasTotal(extras: ExtrasSelection): number {
  return (
    (extras.extraBaggage ? EXTRA_BAGGAGE_PRICE : 0) +
    (extras.travelInsurance ? INSURANCE_PRICE : 0) +
    (extras.priorityBoarding ? PRIORITY_PRICE : 0)
  );
}

export interface ExtrasLineItem {
  label: string;
  price: number;
}

export function extrasLineItems(extras: ExtrasSelection): ExtrasLineItem[] {
  const items: ExtrasLineItem[] = [];
  if (extras.extraBaggage) items.push({ label: "Extra checked baggage", price: EXTRA_BAGGAGE_PRICE });
  if (extras.travelInsurance) items.push({ label: "Travel insurance", price: INSURANCE_PRICE });
  if (extras.priorityBoarding) items.push({ label: "Priority boarding", price: PRIORITY_PRICE });
  if (extras.meal) items.push({ label: `Meal: ${extras.meal}`, price: 0 });
  return items;
}
