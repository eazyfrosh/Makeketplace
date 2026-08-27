import { getCarrier } from "@/lib/logistics/data/carriers";

function randomDigits(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += Math.floor(Math.random() * 10).toString();
  }
  return out;
}

/** e.g. FDX832874928, UPS742893742, DHL483927492, TRK82473928472 */
export function generateTrackingNumber(carrierCode: string) {
  const carrier = getCarrier(carrierCode);
  const length = carrier.code === "GENERIC" ? 11 : 9;
  return `${carrier.prefix}${randomDigits(length)}`;
}

/** e.g. SHP-2026-04829 */
export function generateShipmentNumber() {
  const year = new Date().getFullYear();
  return `SHP-${year}-${randomDigits(5)}`;
}
