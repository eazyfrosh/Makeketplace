"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { Button } from "@/components/ui/button";

function DomainSuccessContent() {
  const params = useSearchParams(); const reference = params.get("reference"); const [state, setState] = React.useState<"checking" | "success" | "review" | "failed">("checking"); const [message, setMessage] = React.useState("Verifying payment and registering your domain securely…");
  React.useEffect(() => { if (!reference) { setState("failed"); setMessage("The payment reference is missing."); return; } getAuthHeaders().then((headers) => fetch("/api/domains/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ reference }) })).then(async (response) => ({ response, data: await response.json() })).then(({ response, data }) => { if (!response.ok) throw new Error(data.error ?? "Domain registration could not be verified."); if (["registered", "email_verification_pending", "email_ready"].includes(data.order?.registrationStatus)) { setState("success"); setMessage("Your domain has been registered. Automatic email setup will continue from your domain dashboard."); } else { setState("review"); setMessage("Your payment was confirmed, but registration requires review. No duplicate registration attempt will be made."); } }).catch((error) => { setState("failed"); setMessage(error instanceof Error ? error.message : "Domain registration could not be completed."); }); }, [reference]);
  return <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-16"><section className="w-full rounded-3xl border bg-card p-8 text-center shadow-sm">{state === "checking" ? <Loader2 className="mx-auto size-10 animate-spin text-primary" /> : state === "success" ? <CheckCircle2 className="mx-auto size-10 text-emerald-500" /> : <TriangleAlert className="mx-auto size-10 text-amber-500" />}<h1 className="mt-5 text-2xl font-semibold">{state === "checking" ? "Completing your purchase" : state === "success" ? "Domain registered" : state === "review" ? "Registration under review" : "Registration not completed"}</h1><p className="mt-3 text-sm text-muted-foreground">{message}</p><Button className="mt-6" asChild><Link href="/dashboard/domains">Open My Domains</Link></Button></section></main>;
}

export default function DomainSuccessPage() {
  return <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>}><DomainSuccessContent /></Suspense>;
}
