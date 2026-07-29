import { getAuthHeaders } from "@/lib/licensing/client-auth";
import type { PaymentProvider } from "@/types";

export interface ConfirmedLicense {
  serviceSlug: string;
  serviceName: string;
  licenseKey: string;
  status: string;
  expiresAt: string | null;
}

export interface ConfirmCheckoutResult {
  order: { id: string; totalCents: number; createdAt: string };
  licenses: ConfirmedLicense[];
}

export async function confirmCheckout(params: {
  provider: PaymentProvider;
  paymentReference: string;
  items: { serviceSlug: string; billing: "one-time" | "monthly" }[];
  couponCode: string | null;
}): Promise<ConfirmCheckoutResult> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch("/api/checkout/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "Failed to confirm checkout.");
  }
  return data as ConfirmCheckoutResult;
}
