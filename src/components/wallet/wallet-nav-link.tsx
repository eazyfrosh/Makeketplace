"use client";
import * as React from "react";
import Link from "next/link";
import { WalletCards } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getAuthHeaders } from "@/lib/licensing/client-auth";

const money = (minor: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(minor / 100);
export function WalletNavLink({ mobile = false }: { mobile?: boolean }) {
  const { user } = useAuth(); const [balance, setBalance] = React.useState<number | null>(null);
  React.useEffect(() => { if (!user) return; getAuthHeaders().then((headers) => fetch("/api/wallet", { headers }).then((r) => r.ok ? r.json() : null)).then((data) => { if (data?.wallet) setBalance(data.wallet.balanceMinor); }).catch(() => undefined); }, [user]);
  if (!user) return null;
  return <Link href="/wallet" className={mobile ? "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium" : "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-accent"}><span className="flex items-center gap-1.5"><WalletCards className="size-4 text-primary" />Wallet</span>{balance !== null && <span className="text-muted-foreground">{money(balance)}</span>}</Link>;
}
