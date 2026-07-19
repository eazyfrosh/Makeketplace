export interface Coupon {
  code: string;
  percentOff: number;
  description: string;
}

export const coupons: Coupon[] = [
  { code: "LAUNCH10", percentOff: 10, description: "10% off any order" },
  { code: "NEXOVA20", percentOff: 20, description: "20% off — new customers" },
];

export function findCoupon(code: string): Coupon | null {
  return coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase()) ?? null;
}
