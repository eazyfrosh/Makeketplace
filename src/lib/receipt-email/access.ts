import "server-only";

import { getPlan, getSubscriptionForUser } from "@/lib/subscriptions/store";
import type { AuthenticatedCaller } from "@/lib/licensing/verify-auth";

export async function requireReceiptEmailAccess(caller: AuthenticatedCaller) {
  if (caller.role === "admin") return;
  const subscription = await getSubscriptionForUser(caller.uid);
  const active = Boolean(
    subscription?.status === "active" &&
      (!subscription.expiresAt || new Date(subscription.expiresAt).getTime() >= Date.now()),
  );
  if (!active || !subscription) throw new Error("ACTIVE_SUBSCRIPTION_REQUIRED");
  const plan = await getPlan(subscription.planId);
  if (!plan || (!plan.includedTools.includes("*") && !plan.includedTools.includes("email-flash"))) {
    throw new Error("ACTIVE_SUBSCRIPTION_REQUIRED");
  }
}
