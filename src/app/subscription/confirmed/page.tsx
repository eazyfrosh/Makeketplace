"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function SubscriptionConfirmedPage() {
  const router = useRouter();
  const [verifiedReturn, setVerifiedReturn] = React.useState(false);
  const checkedReturn = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    if (checkedReturn.current === null) {
      try {
        checkedReturn.current = window.sessionStorage.getItem("eazytool_verified_subscription_return") === "1";
        window.sessionStorage.removeItem("eazytool_verified_subscription_return");
      } catch { checkedReturn.current = false; }
    }
    if (!checkedReturn.current) { router.replace("/dashboard"); return; }
    setVerifiedReturn(true);
    const timer = window.setTimeout(() => router.replace("/dashboard"), 2500);
    return () => window.clearTimeout(timer);
  }, [router]);

  if (!verifiedReturn) return <main className="mx-auto flex min-h-[55vh] items-center justify-center text-sm text-muted-foreground">Returning to your dashboard…</main>;
  return <main className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center px-4 py-20"><div className="glass w-full rounded-3xl p-8 text-center sm:p-12"><CheckCircle2 className="mx-auto size-12 text-emerald-500" /><h1 className="mt-5 text-2xl font-semibold">Subscription activated</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your access is ready. We are taking you to your dashboard.</p><Button asChild className="mt-6"><Link href="/dashboard">Go to dashboard</Link></Button></div></main>;
}
