"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
/**
 * Client-side UX gate backed by the server-side subscription access endpoint.
 * The endpoint verifies the authenticated user, active subscription, expiry,
 * and whether the selected tool is included in the current plan.
 */
export function useRequireLicense(serviceSlug: string) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/auth/login?next=/platform/${serviceSlug}`);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const subscriptionRes = await fetch(`/api/subscriptions/access?serviceSlug=${encodeURIComponent(serviceSlug)}`, { headers });
        const subscriptionData = subscriptionRes.ok ? await subscriptionRes.json() : { allowed: false };
        const allowed = Boolean(subscriptionData.allowed);
        if (cancelled) return;
        if (!allowed) {
          router.push("/dashboard?error=subscription-required");
          return;
        }
        setHasAccess(true);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, serviceSlug, router]);

  return { checking: authLoading || checking, hasAccess };
}
