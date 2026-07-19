import { upsert, getWhere } from "@/lib/services/store";
import type { CartItem, Order, PaymentProvider } from "@/types";

const ORDERS_COLLECTION = "orders";

function generateLicenseKey() {
  const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NXV-${segment()}-${segment()}-${segment()}`;
}

export async function createOrder(params: {
  userId: string | null;
  email: string;
  items: CartItem[];
  discountCents: number;
  couponCode: string | null;
  provider: PaymentProvider;
}): Promise<Order> {
  const subtotalCents = params.items.reduce((sum, item) => sum + item.priceCents, 0);
  const totalCents = Math.max(0, subtotalCents - params.discountCents);
  const licenseKeys = Object.fromEntries(
    params.items.map((item) => [item.packageId, generateLicenseKey()]),
  );

  const order: Order = {
    id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: params.userId,
    email: params.email,
    items: params.items,
    subtotalCents,
    discountCents: params.discountCents,
    totalCents,
    couponCode: params.couponCode,
    provider: params.provider,
    status: "paid",
    licenseKeys,
    createdAt: new Date().toISOString(),
  };

  await upsert(ORDERS_COLLECTION, order);
  return order;
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  return getWhere<Order>(ORDERS_COLLECTION, "userId", userId);
}
