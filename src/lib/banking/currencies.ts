export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
];

export const DEFAULT_CURRENCY = "USD";

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW"]);

const currencyMap = new Map(CURRENCIES.map((c) => [c.code, c]));

export function getCurrencyInfo(code: string): CurrencyInfo {
  return currencyMap.get(code) ?? { code, name: code, symbol: code, flag: "💱" };
}

export function currencyDecimals(code: string) {
  return ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2;
}
