import { currencyDecimals, getCurrencyInfo } from "@/lib/banking/currencies";

export function formatCurrency(amount: number, currency = "USD") {
  const decimals = currencyDecimals(currency);
  const sign = amount < 0 ? "-" : "";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(amount));
  return `${sign}${getCurrencyInfo(currency).symbol}${formatted}`;
}

export function formatDate(date: Date | string | number, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "object" ? date : new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: opts ? undefined : "short",
    ...opts,
  }).format(d);
}

export function maskAccountNumber(accountNumber: string) {
  if (accountNumber.length <= 4) return accountNumber;
  return `••••${accountNumber.slice(-4)}`;
}

export function maskCardNumber(cardNumber: string) {
  const clean = cardNumber.replace(/\s/g, "");
  return `•••• •••• •••• ${clean.slice(-4)}`;
}

export function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export function generateReference() {
  return `TXN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
