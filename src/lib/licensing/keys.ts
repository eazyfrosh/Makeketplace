import { randomBytes, randomUUID } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSegment(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function generateLicenseKey(): string {
  return `NXV-${randomSegment(5)}-${randomSegment(5)}-${randomSegment(5)}`;
}

export function generateId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}
