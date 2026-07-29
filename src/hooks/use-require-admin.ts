"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";

/**
 * Client-side convenience redirect for admin-only pages. This is UX only —
 * it makes the page unusable for non-admins, but it is NOT a security
 * boundary. Every admin API route independently re-verifies the caller's
 * role server-side (see verifyAdminCaller) since a client-side check can
 * always be bypassed.
 */
export function useRequireAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") router.push("/");
  }, [loading, user, router]);

  return { user, loading, isAdmin: !loading && user?.role === "admin" };
}
