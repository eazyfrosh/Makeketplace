/**
 * Absolute URL to the public booking-verification page. Used as the QR code
 * payload so scanning it with any phone camera opens the page directly.
 * Deliberately lives outside /platform/airline-booking-platform (which is
 * license-gated) since whoever scans a boarding pass — e.g. gate staff —
 * won't hold a Nexova license themselves. Includes the booking's
 * verification token so the link itself, not just the short guessable
 * reference, authorizes access.
 */
export function getVerificationUrl(bookingReference: string, verificationToken: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({ token: verificationToken });
  return `${origin}/verify-boarding-pass/${encodeURIComponent(bookingReference)}?${params.toString()}`;
}
