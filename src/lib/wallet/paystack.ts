import crypto from "node:crypto";

export function verifyPaystackSignature(rawBody: string, suppliedSignature: string, secret: string) {
  if (!suppliedSignature || !secret) return false;
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const actual = suppliedSignature.trim().toLowerCase();
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actual, "utf8"), Buffer.from(expected, "utf8"));
}

export async function verifyPaystackTransaction(reference: string, secret: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as {
    status?: boolean;
    data?: { status?: string; amount?: number; currency?: string; reference?: string; id?: number; metadata?: Record<string, unknown> };
  } | null;
  if (!response.ok || !payload?.status || !payload.data) throw new Error("Payment verification failed.");
  return payload.data;
}
