import { SignJWT, jwtVerify, errors as joseErrors } from "jose";
import { randomBytes } from "crypto";
import type { AccessTokenPayload } from "@/types/licensing";

const ACCESS_TOKEN_TTL_SECONDS = 120;

declare global {
  var __nexovaLicenseDevSecret: Uint8Array | undefined;
}

// Falls back to a random per-boot secret so the app still runs zero-config in
// dev/demo mode. Stored on globalThis, not a module-level variable — Next.js
// compiles each API route as its own module instance, so a plain `let` would
// produce a different random secret per route and break verification across
// routes entirely. Set LICENSE_JWT_SECRET for any real deployment — the
// fallback also can't survive a restart or span multiple server instances.
function getSecret(): Uint8Array {
  if (process.env.LICENSE_JWT_SECRET) {
    return new TextEncoder().encode(process.env.LICENSE_JWT_SECRET);
  }
  if (!global.__nexovaLicenseDevSecret) {
    global.__nexovaLicenseDevSecret = randomBytes(32);
    console.warn(
      "[licensing] LICENSE_JWT_SECRET is not set — using a random per-boot secret. " +
        "Set LICENSE_JWT_SECRET in production so access tokens stay valid across restarts/instances.",
    );
  }
  return global.__nexovaLicenseDevSecret;
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ serviceId: payload.serviceId, licenseId: payload.licenseId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .setIssuer("nexova-licensing")
    .sign(getSecret());
}

export type VerifyAccessTokenResult =
  | { valid: true; payload: AccessTokenPayload }
  | { valid: false; reason: "expired" | "invalid" };

export async function verifyAccessToken(token: string): Promise<VerifyAccessTokenResult> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: "nexova-licensing" });
    if (!payload.sub || typeof payload.serviceId !== "string" || typeof payload.licenseId !== "string") {
      return { valid: false, reason: "invalid" };
    }
    return {
      valid: true,
      payload: { sub: payload.sub, serviceId: payload.serviceId, licenseId: payload.licenseId },
    };
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      return { valid: false, reason: "expired" };
    }
    return { valid: false, reason: "invalid" };
  }
}
