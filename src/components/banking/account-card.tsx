import { CreditCard } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/banking/animated-counter";
import { currencyDecimals, getCurrencyInfo } from "@/lib/banking/currencies";
import { maskAccountNumber } from "@/lib/banking/format";
import type { Account } from "@/lib/banking/types";

export function AccountCard({ account }: { account: Account }) {
  const currency = getCurrencyInfo(account.currency);

  return (
    <Card className="relative overflow-hidden">
      <div className="bg-mesh pointer-events-none absolute inset-0 opacity-60" />
      <CardContent className="relative flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
            <CreditCard className="size-5" />
          </span>
          <div className="flex items-center gap-1.5">
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
              {currency.flag} {account.currency}
            </span>
            {account.isPrimary && (
              <span className="bg-success/15 text-success rounded-full px-2 py-0.5 text-[10px] font-medium">
                Primary
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{account.name}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            <AnimatedCounter
              value={account.balance}
              prefix={currency.symbol}
              decimals={currencyDecimals(account.currency)}
            />
          </p>
        </div>
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>{maskAccountNumber(account.accountNumber)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
