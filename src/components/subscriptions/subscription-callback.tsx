"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { Button } from "@/components/ui/button";

export function SubscriptionCallback() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = React.useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = React.useState("Verifying your Paystack payment securely…");

  React.useEffect(() => {
    if (authLoading || !user) return;
    const reference = params.get("reference") ?? params.get("trxref");
    const planId = params.get("planId");
    const billingCycle = params.get("billingCycle") === "yearly" ? "yearly" : "monthly";
    if (!reference || !planId) {
      setState("error");
      setMessage("The subscription callback is missing payment details.");
      return;
    }
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch("/api/subscriptions/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ reference, planId, billingCycle }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "Paystack payment verification failed.");
        setState("success");
        setMessage(`Your ${data.plan.name} subscription is active.`);
        window.setTimeout(() => router.replace("/dashboard"), 900);
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "We could not activate the subscription.");
      }
    })();
  }, [authLoading, user, params, router]);

  return <main className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center px-4 py-20"><div className="glass w-full rounded-3xl p-8 text-center sm:p-12">{state === "loading" && <Loader2 className="mx-auto size-10 animate-spin text-primary" />}{state === "success" && <CheckCircle2 className="mx-auto size-12 text-emerald-500" />}{state === "error" && <XCircle className="mx-auto size-12 text-destructive" />}<h1 className="mt-5 text-2xl font-semibold">{state === "success" ? "Subscription activated" : state === "error" ? "Activation needs attention" : "Confirming payment"}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>{state === "error" && <div className="mt-7 flex justify-center gap-3"><Button asChild><Link href="/pricing">Return to pricing</Link></Button><Button variant="secondary" asChild><Link href="/contact">Contact support</Link></Button></div>}</div></main>;
}
