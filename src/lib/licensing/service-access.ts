import "server-only";

import { getLicenseForUserAndService } from "@/lib/licensing/store";
import { getPlan, getSubscriptionForUser } from "@/lib/subscriptions/store";

type AccessRole = "admin" | "customer" | string;

export interface ServiceAccessResult {
  allowed: boolean;
  source: "admin" | "subscription" | "license" | null;
  entitlementId: string | null;
  planName: string | null;
}

function isUnexpired(expiresAt: string | null | undefined) {
  return !expiresAt || new Date(expiresAt).getTime() >= Date.now();
}

/**
 * Resolves service access from trusted server-side records. Complimentary and
 * purchased lifetime licenses are first-class entitlements, not merely rows
 * shown on the dashboard.
 */
export async function resolveServiceAccess(
  userId: string,
  role: AccessRole,
  serviceSlug: string,
  alternateLicenseSlugs: string[] = [],
): Promise<ServiceAccessResult> {
  if (role === "admin") {
    return { allowed: true, source: "admin", entitlementId: `admin:${userId}`, planName: "Administrator" };
  }

  for (const slug of [serviceSlug, ...alternateLicenseSlugs]) {
    const license = await getLicenseForUserAndService(userId, slug);
    if (license?.status === "active" && isUnexpired(license.expiresAt)) {
      return { allowed: true, source: "license", entitlementId: license.id, planName: "Complimentary access" };
    }
  }

  const subscription = await getSubscriptionForUser(userId);
  const activeSubscription = Boolean(
    subscription &&
      ["active", "non_renewing"].includes(subscription.status) &&
      isUnexpired(subscription.expiresAt),
  );
  if (!activeSubscription || !subscription) {
    return { allowed: false, source: null, entitlementId: null, planName: null };
  }

  const plan = await getPlan(subscription.planId);
  const allowed = Boolean(
    plan &&
      (plan.includedTools.includes("*") ||
        plan.includedTools.includes(serviceSlug) ||
        alternateLicenseSlugs.some((slug) => plan.includedTools.includes(slug))),
  );
  return {
    allowed,
    source: allowed ? "subscription" : null,
    entitlementId: allowed ? subscription.id : null,
    planName: allowed ? plan?.name ?? null : null,
  };
}
