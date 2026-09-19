import "server-only";

function positiveInteger(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

export const walletLimits = Object.freeze({
  minimumDepositMinor: positiveInteger("WALLET_MIN_DEPOSIT_MINOR", 100_000),
  maximumSingleDepositMinor: positiveInteger("WALLET_MAX_SINGLE_DEPOSIT_MINOR", 100_000_000),
  maximumWalletBalanceMinor: positiveInteger("WALLET_MAX_BALANCE_MINOR", 500_000_000),
  maximumDailyFundingMinor: positiveInteger("WALLET_MAX_DAILY_FUNDING_MINOR", 200_000_000),
});

export function publicWalletLimits() {
  return { ...walletLimits, currency: "NGN" as const };
}
