import { randomBytes } from "crypto";

export const DEFAULT_COMMISSION_RATE_PERCENT = 20;

// Excludes visually ambiguous characters (0/O, 1/I).
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateAffiliateCode(): string {
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return code;
}
