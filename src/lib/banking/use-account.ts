"use client";

import * as React from "react";

import { getAccount, type RedactedCard } from "@/lib/banking/client";
import type { Account, Transaction } from "@/lib/banking/types";

interface AccountState {
  account: Account;
  card: RedactedCard;
  transactions: Transaction[];
  hasPin: boolean;
}

export function useBankingAccount() {
  const [data, setData] = React.useState<AccountState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAccount();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your account.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
