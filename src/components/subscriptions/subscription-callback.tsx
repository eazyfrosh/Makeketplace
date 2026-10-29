"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { Button } from "@/components/ui/button";
import { trackSubscriptionPurchase } from "@/lib/analytics/ga4";
import { trackTikTokPurchase } from "@/lib/analytics/tiktok";

export function SubscriptionCallback() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = React.useState<"loading" | "pending" | "success" | "error">("loading");
  const [message, setMessage] = React.useState("Verifying your Paystack payment securely…");
  const startedReference = React.useRef("");

  React.useEffect(() => {
    if (authLoading || !user) return;
    const reference = params.get("reference") ?? params.get("trxref");
    if (!reference) {
      setState("error");
      setMessage("The subscription callback is missing payment details.");
      return;
    }
    if (startedReference.current === reference) return;
    startedReference.current = reference;
    let cancelled = false;
    (async () => {
      try {
        const headers = await getAuthHeaders();
        let response: Response;
        let data: { status?: string; error?: string; plan?: { id: string; name: string }; verifiedPayment?: { amountMinor: number; currency: string } };
        for (let attempt = 0; attempt < 12; attempt++) {
          response = await fetch("/api/subscriptions/activate", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({ reference }),
          });
          data = await response.json();
          if (response.status !== 202 || cancelled) break;
          setMessage("Your transfer is being confirmed by Paystack. We will activate your access when it clears…");
          await new Promise((resolve) => window.setTimeout(resolve, 5000));
        }
        if (cancelled) return;
        if (response!.status === 202) {
          setState("pending");
          setMessage("Your transfer is still being confirmed. Please check your dashboard shortly. If access does not appear after Paystack confirms the payment, contact support with your transaction reference.");
          return;
        }
        if (!response!.ok) throw new Error(data!.error ?? "Paystack payment verification failed.");
        trackSubscriptionPurchase(reference, data!.plan?.id ?? "custom");
        if (data!.verifiedPayment?.currency === "NGN" && Number.isSafeInteger(data!.verifiedPayment.amountMinor)) {
          // The amount comes from the server's verified Paystack/Firestore record,
          // never the checkout page or a browser-supplied price.
          trackTikTokPurchase(reference, data!.verifiedPayment!.amountMinor, data!.verifiedPayment!.currency);
        }
        setState("success");
        setMessage(`Your ${data!.plan!.name} subscription is active.`);
        try { window.sessionStorage.setItem("eazytool_verified_subscription_return", "1"); } catch { /* The dashboard remains the fallback. */ }
        window.setTimeout(() => router.replace("/subscription/confirmed"), 900);
      } catch (error) {
        if (!cancelled) {
          setState("error");
          setMessage(error instanceof Error ? error.message : "We could not activate the subscription.");
        }
      }
    })();
    return () => { cancelled = true; if (startedReference.current === reference) startedReference.current = ""; };
  }, [authLoading, user, params, router]);

  return <main className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center px-4 py-20"><div className="glass w-full rounded-3xl p-8 text-center sm:p-12">{state === "loading" && <Loader2 className="mx-auto size-10 animate-spin text-primary" />}{state === "pending" && <Clock3 className="mx-auto size-12 text-amber-500" />}{state === "success" && <CheckCircle2 className="mx-auto size-12 text-emerald-500" />}{state === "error" && <XCircle className="mx-auto size-12 text-destructive" />}<h1 className="mt-5 text-2xl font-semibold">{state === "success" ? "Subscription activated" : state === "pending" ? "Waiting for transfer confirmation" : state === "error" ? "Activation needs attention" : "Confirming payment"}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>{state === "pending" && <div className="mt-7 flex justify-center gap-3"><Button asChild><Link href="/dashboard">Check your dashboard</Link></Button><Button variant="secondary" asChild><Link href="/contact">Contact support</Link></Button></div>}{state === "error" && <div className="mt-7 flex justify-center gap-3"><Button asChild><Link href="/pricing">Return to pricing</Link></Button><Button variant="secondary" asChild><Link href="/contact">Contact support</Link></Button></div>}</div></main>;
}
