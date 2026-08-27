import "server-only";
import { SignJWT, jwtVerify, errors as joseErrors } from "jose";
import { randomBytes } from "crypto";

const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours

declare global {
  var __nexovaBankingDevSecret: Uint8Array | undefined;
}

// Same globalThis-fallback pattern as src/lib/licensing/jwt.ts, kept as a
// separate secret/issuer so a banking session can never be replayed as (or
// confused with) a Nexova license access token. Set BANKING_SESSION_JWT_SECRET
// for any real deployment — the fallback can't survive a restart or span
// multiple server instances.
function getSecret(): Uint8Array {
  if (process.env.BANKING_SESSION_JWT_SECRET) {
    return new TextEncoder().encode(process.env.BANKING_SESSION_JWT_SECRET);
  }
  if (!global.__nexovaBankingDevSecret) {
    global.__nexovaBankingDevSecret = randomBytes(32);
    console.warn(
      "[banking] BANKING_SESSION_JWT_SECRET is not set — using a random per-boot secret. " +
        "Set BANKING_SESSION_JWT_SECRET in production so banking sessions stay valid across restarts/instances.",
    );
  }
  return global.__nexovaBankingDevSecret;
}

export async function signBankingSession(uid: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(uid)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setIssuer("nexova-banking")
    .sign(getSecret());
}

/** Verifies the `x-banking-session` header proves the caller (already authenticated as `uid` via verifyCaller) also completed the banking sign-in flow. */
export async function verifyBankingSession(request: Request, uid: string): Promise<boolean> {
  const token = request.headers.get("x-banking-session");
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: "nexova-banking" });
    return payload.sub === uid;
  } catch (error) {
    if (!(error instanceof joseErrors.JWTExpired) && !(error instanceof joseErrors.JWTInvalid)) {
      console.error("[banking] session verification failed:", error);
    }
    return false;
  }
}
