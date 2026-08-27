import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashSecret(secret: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(secret, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifySecret(secret: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const candidate = scryptSync(secret, salt, 64);
  if (candidate.length !== hashBuffer.length) return false;
  return timingSafeEqual(candidate, hashBuffer);
}
