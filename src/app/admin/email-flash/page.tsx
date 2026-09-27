"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck, MailWarning, Send } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import type { ReceiptEmailSend } from "@/lib/receipt-email/types";

type Summary = { totalTemplates: number; totalSends: number; delivered: number; failures: number; recent: ReceiptEmailSend[] };

export default function EmailFlashAdminPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin();
  const [summary, setSummary] = React.useState<Summary | null>(null);

  React.useEffect(() => {
    if (!isAdmin) return;
    getAuthHeaders().then((headers) => fetch("/api/email-flash/admin/summary", { headers, cache: "no-store" }))
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setSummary(data); })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Email Designer usage could not be loaded."));
  }, [isAdmin]);

  if (authLoading || !isAdmin || !summary) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <Button variant="ghost" size="sm" asChild><Link href="/admin"><ArrowLeft className="size-4" />Admin overview</Link></Button>
    <div className="mt-5"><h1 className="text-3xl font-bold">Email Designer usage</h1><p className="mt-2 text-muted-foreground">Review design adoption, delivery status, and provider failures. Customer email content remains owner-scoped.</p></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[{ label: "Saved templates", value: summary.totalTemplates, icon: MailCheck }, { label: "Emails sent", value: summary.totalSends, icon: Send }, { label: "Delivered", value: summary.delivered, icon: MailCheck }, { label: "Delivery failures", value: summary.failures, icon: MailWarning }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border bg-card p-5"><Icon className="size-5 text-primary" /><div className="mt-3 text-2xl font-bold">{value}</div><div className="text-sm text-muted-foreground">{label}</div></div>)}
    </div>
    <section className="mt-8 rounded-3xl border bg-card p-5"><h2 className="font-semibold">Recent delivery activity</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="text-xs uppercase text-muted-foreground"><tr><th className="pb-3">User</th><th className="pb-3">Recipient</th><th className="pb-3">Brand</th><th className="pb-3">Subject</th><th className="pb-3">Type</th><th className="pb-3">Status</th><th className="pb-3">Failure</th></tr></thead><tbody className="divide-y">{summary.recent.map((item) => <tr key={item.id}><td className="py-3 font-mono text-xs">{item.userId.slice(0, 12)}…</td><td className="py-3">{item.recipientEmail}</td><td className="py-3">{item.brandName}</td><td className="max-w-56 truncate py-3">{item.subject}</td><td className="py-3 capitalize">{item.sendMode}</td><td className="py-3"><Badge variant={["failed", "bounced", "complained", "suppressed"].includes(item.status) ? "destructive" : "secondary"}>{item.status}</Badge></td><td className="max-w-64 truncate py-3 text-xs text-muted-foreground" title={item.error ?? ""}>{item.error ?? "—"}</td></tr>)}</tbody></table>{summary.recent.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No Email Designer activity yet.</p>}</div></section>
  </main>;
}
