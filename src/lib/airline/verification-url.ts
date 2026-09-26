/**
 * Absolute URL to the public booking-verification page. Used as the QR code
 * payload so scanning it with any phone camera opens the page directly.
 * QR codes generated inside EazyTools must open the standalone SkyBook app,
 * rather than inheriting the EazyTools browser origin. The public origin can
 * be overridden for a custom SkyBook domain without changing application
 * code. The verification token is preserved so a short booking reference on
 * its own is not enough to construct a verification link.
 */
const DEFAULT_FLIGHTBOOK_ORIGIN = "https://flightbook-dusky.vercel.app";

export function getFlightbookOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_FLIGHTBOOK_ORIGIN?.trim();
  try {
    const url = new URL(configured || DEFAULT_FLIGHTBOOK_ORIGIN);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return DEFAULT_FLIGHTBOOK_ORIGIN;
    }
    return url.origin;
  } catch {
    return DEFAULT_FLIGHTBOOK_ORIGIN;
  }
}

export function getVerificationUrl(
  bookingReference: string,
  verificationToken: string,
): string {
  const url = new URL(
    `/verify/${encodeURIComponent(bookingReference.trim().toUpperCase())}`,
    getFlightbookOrigin(),
  );
  url.searchParams.set("token", verificationToken.trim());
  return url.toString();
}
