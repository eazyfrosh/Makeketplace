import { jwtVerify, createRemoteJWKSet } from "jose";
import { adminAuth, adminDb, isAdminDbConfigured } from "@/lib/licensing/admin-db";
import { DEMO_ADMIN_UID } from "@/lib/licensing/demo-constants";
import type { UserRole } from "@/context/auth-context";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const isFirebaseProjectConfigured = Boolean(projectId);

// Firebase ID tokens are RS256 JWTs signed by Google's securetoken service.
// Their signature can be verified against Google's published public keys
// without needing any server-side Firebase Admin credentials.
const googleJwks = isFirebaseProjectConfigured
  ? createRemoteJWKSet(
      new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
    )
  : null;

export interface AuthenticatedCaller {
  uid: string;
  email: string;
  role: UserRole;
}

async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string; email: string } | null> {
  // Prefer Admin SDK verification when a service account is configured.
  if (isAdminDbConfigured && adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      return { uid: decoded.uid, email: decoded.email ?? "" };
    } catch {
      return null;
    }
  }

  if (!googleJwks || !projectId) return null;
  try {
    const { payload } = await jwtVerify(idToken, googleJwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    if (!payload.sub) return null;
    return { uid: payload.sub, email: typeof payload.email === "string" ? payload.email : "" };
  } catch {
    return null;
  }
}

// When Admin SDK isn't configured, fetch the caller's own profile document via
// the Firestore REST API using their own ID token as the bearer credential.
// Firestore enforces firestore.rules exactly the same way for REST calls as
// for the client SDK, so this is a genuine server-side, rule-enforced read —
// not a client-asserted claim — and needs no admin credentials.
async function getRoleViaFirestoreRest(uid: string, idToken: string): Promise<UserRole> {
  if (!projectId) return "customer";
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
      { headers: { Authorization: `Bearer ${idToken}` } },
    );
    if (!res.ok) return "customer";
    const data = await res.json();
    const role = data?.fields?.role?.stringValue;
    return role === "admin" ? "admin" : "customer";
  } catch {
    return "customer";
  }
}

async function getRole(uid: string, idToken: string): Promise<UserRole> {
  if (isAdminDbConfigured && adminDb) {
    const snap = await adminDb.collection("users").doc(uid).get();
    return snap.exists && snap.data()?.role === "admin" ? "admin" : "customer";
  }
  return getRoleViaFirestoreRest(uid, idToken);
}

/**
 * Authenticates an incoming API request. Real mode: verifies a Firebase ID
 * token's signature (Admin SDK if configured, else Google's public JWKS) and
 * resolves role from Firestore itself (never trusts a client-asserted role).
 *
 * Demo mode (no Firebase project configured at all) has no real identity
 * system — the whole demo backend is client localStorage. We accept an
 * `x-demo-uid` header for continuity with the existing demo auth, which is
 * already not a real security boundary (plaintext passwords in
 * localStorage). Only the well-known seeded demo admin uid is granted the
 * admin role; every other demo uid is a customer.
 */
export async function verifyCaller(request: Request): Promise<AuthenticatedCaller | null> {
  const authHeader = request.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (isFirebaseProjectConfigured) {
    if (!idToken) return null;
    const identity = await verifyFirebaseIdToken(idToken);
    if (!identity) return null;
    const role = await getRole(identity.uid, idToken);
    return { uid: identity.uid, email: identity.email, role };
  }

  const demoUid = request.headers.get("x-demo-uid");
  if (demoUid) {
    return {
      uid: demoUid,
      email: request.headers.get("x-demo-email") ?? "",
      role: demoUid === DEMO_ADMIN_UID ? "admin" : "customer",
    };
  }

  return null;
}

/** Same as verifyCaller, but also requires the caller to hold the admin role. */
export async function verifyAdminCaller(request: Request): Promise<AuthenticatedCaller | null> {
  const caller = await verifyCaller(request);
  if (!caller || caller.role !== "admin") return null;
  return caller;
}
