"use client";

import { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";

import { LicenseGuard } from "@/components/platform/license-guard";

export default function PremiumTemplatesPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function openExternalEditor() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/licenses/issue-access-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceSlug: "premium-templates" }),
      });
      const data = await response.json();
      if (!response.ok || !data.redirectUrl) throw new Error(data.error || "Unable to open the template.");
      window.location.assign(data.redirectUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to open the template.");
      setBusy(false);
    }
  }

  return (
    <LicenseGuard serviceSlug="premium-templates" themeClass="">
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-400">Premium template</p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Open your Volterra website</h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Continue to the hosted website to update its business name, logo, support email content, and phone number.
          </p>
          <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 font-semibold text-white hover:bg-rose-400 disabled:opacity-60" onClick={openExternalEditor} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" size={18} /> : <ArrowUpRight size={18} />}
            {busy ? "Opening…" : "Open website editor"}
          </button>
          {error && <p className="mt-4 text-sm text-rose-300" role="alert">{error}</p>}
        </section>
      </main>
    </LicenseGuard>
  );
}
