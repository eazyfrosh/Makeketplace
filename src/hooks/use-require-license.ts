"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import type { LicenseStatus } from "@/types/licensing";

interface LicenseSummary {
  serviceSlug: string;
  status: LicenseStatus;
}

/**
 * Client-side gate for the ported platform pages that live behind a
 * license's "Access" button. Mirrors useRequireAdmin's pattern: this is UX
 * only, not a security boundary — nothing sensitive is served by these
 * routes without its own server-side checks.
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
        const res = await fetch("/api/licenses/mine", { headers });
        const data = res.ok ? await res.json() : { licenses: [] };
        const licenses: LicenseSummary[] = data.licenses ?? [];
        const active = licenses.some((l) => l.serviceSlug === serviceSlug && l.status === "active");
        if (cancelled) return;
        if (!active) {
          router.push("/dashboard?error=license-required");
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
