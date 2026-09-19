export function assertMinorUnits(value: number, label = "amount") {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer in minor units.`);
}

export function applyBalanceChange(balanceMinor: number, amountMinor: number, direction: "credit" | "debit") {
  assertMinorUnits(balanceMinor, "balance"); assertMinorUnits(amountMinor, "amount");
  if (amountMinor === 0) throw new Error("amount must be greater than zero.");
  const next = direction === "credit" ? balanceMinor + amountMinor : balanceMinor - amountMinor;
  if (!Number.isSafeInteger(next)) throw new Error("Wallet balance exceeds safe integer precision.");
  if (next < 0) throw new Error("INSUFFICIENT_BALANCE");
  return next;
}

export class WalletLedgerModel {
  balanceMinor: number; readonly references = new Set<string>();
  constructor(balanceMinor = 0) { assertMinorUnits(balanceMinor, "balance"); this.balanceMinor = balanceMinor; }
  post(reference: string, amountMinor: number, direction: "credit" | "debit") {
    if (this.references.has(reference)) return false;
    const next = applyBalanceChange(this.balanceMinor, amountMinor, direction);
    this.references.add(reference); this.balanceMinor = next; return true;
  }
}
