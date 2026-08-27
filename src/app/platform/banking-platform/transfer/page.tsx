"use client";

import { useBankingAccount } from "@/lib/banking/use-account";
import { TransferForm } from "@/components/banking/transfer-form";
import { SetPinGate } from "@/components/banking/set-pin-gate";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransferPage() {
  const { data, loading, error, reload } = useBankingAccount();

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Transfer money</h1>
      {loading || !data ? (
        <Skeleton className="h-96" />
      ) : !data.hasPin ? (
        <SetPinGate onDone={reload} />
      ) : (
        <TransferForm account={data.account} />
      )}
    </div>
  );
}
