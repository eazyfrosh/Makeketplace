import "server-only";
import { debitWallet } from "@/lib/wallet/store";

/** Reusable trusted-server purchase entry point. Client prices are deliberately absent. */
export async function purchaseWithWallet(input: { userId: string; serviceType: string; serviceId: string; reference: string; authoritativeAmountMinor: number; description: string; metadata?: Record<string, string | number | boolean | null> }) {
  return debitWallet({ userId: input.userId, amountMinor: input.authoritativeAmountMinor, reference: input.reference, description: input.description, serviceType: input.serviceType, serviceId: input.serviceId, metadata: input.metadata });
}
