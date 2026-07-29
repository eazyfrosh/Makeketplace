"use client";

import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import { getOne } from "@/lib/services/store";
import type { UserProfile } from "@/context/auth-context";

const DEMO_SESSION_KEY = "nexova_demo_session";

/**
 * Builds the auth headers the licensing API routes expect. Real mode attaches
 * a fresh, short-lived Firebase ID token (verified server-side against
 * Google's public keys). Demo mode attaches the local demo session uid —
 * this is not a real credential, it's a continuity shim for the same
 * localStorage-based demo auth already used throughout the app.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (isFirebaseConfigured && auth?.currentUser) {
    const token = await auth.currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }
  if (typeof window !== "undefined") {
    const uid = window.localStorage.getItem(DEMO_SESSION_KEY);
    if (uid) {
      const profile = await getOne<UserProfile>("users", uid);
      return { "x-demo-uid": uid, "x-demo-email": profile?.email ?? "" };
    }
  }
  return {};
}
