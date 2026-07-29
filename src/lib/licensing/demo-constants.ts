// Shared between the client-only auth context and server-only API routes —
// kept in a plain module (no "use client") so both sides resolve the exact
// same value without relying on cross-boundary import quirks.
export const DEMO_ADMIN_UID = "demo-admin-uid";
