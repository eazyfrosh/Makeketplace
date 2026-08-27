export interface CarrierTheme {
  primary: string;
  secondary: string;
  onPrimary: string;
  onSecondary: string;
}

interface CarrierThemeInput {
  primary: string;
  secondary: string;
}

const THEME_INPUTS: Record<string, CarrierThemeInput> = {
  DHL: { primary: "#FFCC00", secondary: "#D40511" },
  FEDEX: { primary: "#4D148C", secondary: "#FF6600" },
  UPS: { primary: "#351C15", secondary: "#FFB500" },
  USPS: { primary: "#004B87", secondary: "#D2232A" },
  ROYALMAIL: { primary: "#CC0000", secondary: "#FFD100" },
  CANADAPOST: { primary: "#E31837", secondary: "#333333" },
  AUSPOST: { primary: "#E4002B", secondary: "#FFCD00" },
  ARAMEX: { primary: "#D71920", secondary: "#4A4A4A" },
  TNT: { primary: "#FF6600", secondary: "#333333" },
  DPD: { primary: "#B0003A", secondary: "#555555" },
  GLS: { primary: "#003B7A", secondary: "#FFD100" },
};

const DEFAULT_THEME_INPUT: CarrierThemeInput = { primary: "#5b5df0", secondary: "#14b8a6" };

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function contrastText(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  const linearize = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  return luminance > 0.55 ? "#0b0f1a" : "#ffffff";
}

function buildTheme(input: CarrierThemeInput): CarrierTheme {
  return {
    primary: input.primary,
    secondary: input.secondary,
    onPrimary: contrastText(input.primary),
    onSecondary: contrastText(input.secondary),
  };
}

export const DEFAULT_CARRIER_THEME: CarrierTheme = buildTheme(DEFAULT_THEME_INPUT);

const THEME_CACHE = new Map<string, CarrierTheme>();

export function getCarrierTheme(carrierCode: string): CarrierTheme {
  const key = carrierCode.toUpperCase();
  const cached = THEME_CACHE.get(key);
  if (cached) return cached;
  const input = THEME_INPUTS[key];
  const theme = input ? buildTheme(input) : DEFAULT_CARRIER_THEME;
  THEME_CACHE.set(key, theme);
  return theme;
}
