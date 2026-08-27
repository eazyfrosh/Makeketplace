export const CARRIER_LOGO_DIR = "/carriers";
export const DEFAULT_CARRIER_LOGO = `${CARRIER_LOGO_DIR}/default.svg`;

/** Carrier code -> logo filename slug in /public/carriers. Only carriers with a copied logo file are listed. */
export const carrierLogoSlugs: Record<string, string> = {
  GENERIC: "default",
  DHL: "dhl",
  FEDEX: "fedex",
  UPS: "ups",
  USPS: "usps",
  ARAMEX: "aramex",
  TNT: "tnt",
  CANADAPOST: "canada-post",
  ROYALMAIL: "royal-mail",
  DPD: "dpd",
  GLS: "gls",
  AUSPOST: "australia-post",
  BLUEDART: "blue-dart",
  PUROLATOR: "purolator",
  JAPANPOST: "japan-post",
  POSTNL: "postnl",
  CORREOS: "correos",
  SWISSPOST: "swiss-post",
};

export function getCarrierLogoSrc(code: string): string {
  const slug = carrierLogoSlugs[code];
  return slug ? `${CARRIER_LOGO_DIR}/${slug}.svg` : DEFAULT_CARRIER_LOGO;
}
