/** TrackNova resolves a tracking number and opens the matching public shipment. */
export function getTrackNovaTrackingUrl(trackingNumber: string) {
  return `https://www.tracknova.app/track?q=${encodeURIComponent(trackingNumber)}`;
}
