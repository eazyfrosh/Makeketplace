"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Globe2, Loader2, Search, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HelpCallout } from "@/components/ui/help-callout";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { userFacingError } from "@/lib/user-error";
import { domainPriceNaira, COMMON_TLDS, type DomainAvailability } from "@/types/domains";

const ownerFields = [
  ["name", "Full legal name", "Ada Okafor"], ["phone", "Phone number", "+234 800 000 0000"],
  ["organization", "Business name (optional)", "Your Business Ltd"], ["address", "Street address", "12 Example Street"],
  ["city", "City", "Lagos"], ["state", "State", "Lagos"], ["country", "Country code", "NG"], ["postalCode", "Postal code", "100001"],
] as const;

export default function DomainsPage() {
  const { user } = useAuth();
  const [templateId, setTemplateId] = React.useState<string | null>(null);
  const [templateSiteId, setTemplateSiteId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<DomainAvailability[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [purchasesEnabled, setPurchasesEnabled] = React.useState(false);
  const [registrant, setRegistrant] = React.useState({ name: "", phone: "", organization: "", address: "", city: "", state: "", country: "NG", postalCode: "" });
  const [acceptRegistrarTerms, setAcceptRegistrarTerms] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTemplateId(params.get("template"));
    setTemplateSiteId(params.get("site"));
  }, []);

  const linking = (templateId === "elite-broker" || templateId === "volterra") && Boolean(templateSiteId);
  const registrantReady = Boolean(registrant.name && registrant.phone && registrant.address && registrant.city && registrant.state && registrant.country && registrant.postalCode && acceptRegistrarTerms);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return setMessage("Sign in first, then return here to search for your domain.");
    if (!query.trim()) return setMessage("Enter the domain you want to search for, such as yourbusiness.com.");
    setLoading(true);
    setMessage("");
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/domains/search", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ domain: query.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResults(data.results ?? []);
      setPurchasesEnabled(data.purchasesEnabled === true);
      if (!data.configured) setMessage(data.message ?? "Domain service is being configured. Please try again later.");
    } catch (error) {
      setMessage(userFacingError(error, "We could not search for that domain. Check the spelling and try again."));
    } finally {
      setLoading(false);
    }
  }

  async function buy(domain: string, method: "paystack" | "wallet") {
    if (!user) return setMessage("Sign in first, then return here to buy your domain.");
    if (!registrantReady) return setMessage("Complete the domain owner details and accept the registration terms before continuing.");
    setLoading(true);
    setMessage("");
    try {
      const headers = await getAuthHeaders();
      const endpoint = method === "wallet" ? "/api/domains/checkout/wallet" : "/api/domains/checkout/initialize";
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ domain, registrant, acceptRegistrarTerms, templateId: linking ? templateId : undefined, templateSiteId: linking ? templateSiteId : undefined, idempotencyKey: crypto.randomUUID() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.authorizationUrl) window.location.href = data.authorizationUrl;
      else setMessage(method === "wallet" ? "Payment confirmed and your domain registration has started." : data.message ?? "Secure checkout will be available when the payment service is ready.");
    } catch (error) {
      setMessage(userFacingError(error, "We could not start the domain purchase. No payment was taken."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell max-w-6xl">
      <section className="rounded-3xl bg-primary/[0.08] px-5 py-12 text-center sm:px-12 sm:py-16">
        <ShieldCheck className="mx-auto size-8 text-primary" aria-hidden="true" />
        <p className="mt-5 text-sm font-semibold text-primary">Your business address online</p>
        <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">{linking ? "Publish on your own domain" : "Find a domain for your business"}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty leading-7 text-muted-foreground">{linking ? "Choose an address for your website. EazyTool will keep it connected to the correct template project." : "A domain is the address people type to visit your website, such as yourbusiness.com. Search below to see what is available."}</p>
        {linking && <p className="mx-auto mt-5 max-w-xl rounded-xl border bg-background/70 px-4 py-3 text-sm">Connecting <strong>{templateId === "elite-broker" ? "ELITE BROKER" : "Volterra"}</strong> website <code>{templateSiteId}</code></p>}
        <form onSubmit={search} className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input aria-label="Domain name" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="yourbusiness.com" className="h-12 w-full rounded-xl border bg-background pl-11 pr-4 outline-none focus:ring-2 focus:ring-ring" /></div>
          <Button type="submit" disabled={loading} className="sm:min-w-28">{loading ? <><Loader2 className="size-4 animate-spin" />Checking…</> : "Search"}</Button>
        </form>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">{COMMON_TLDS.slice(0, 8).map((tld) => <button type="button" key={tld} onClick={() => setQuery(`yourbusiness${tld}`)} className="min-h-9 rounded-full border px-3 py-1 hover:bg-background">{tld}</button>)}</div>
        {message && <p role="status" className="mx-auto mt-5 max-w-2xl rounded-xl border bg-background/70 px-4 py-3 text-sm">{message}</p>}
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">{["Search for a name", "Add owner details", "Review and pay securely"].map((step, index) => <div key={step} className="surface-card flex items-center gap-3 p-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</span><span className="text-sm font-medium">{step}</span></div>)}</div>
      <HelpCallout className="mt-5" title={purchasesEnabled ? "What happens after you buy?" : "Availability search is ready"}>{purchasesEnabled ? "Payment is confirmed first. Registration then starts with the domain provider. Your dashboard will show whether setup is pending, complete, or needs attention. You are never shown a successful registration until the provider confirms it." : "You can check which names are available. Purchasing and payment are temporarily disabled while live registration is being completed."}</HelpCallout>

      {results.some((item) => item.available) && <section className="mt-8 rounded-3xl border bg-card p-5 sm:p-6"><div className="flex items-start gap-3"><Globe2 className="mt-1 size-5 text-primary" /><div><h2 className="text-xl font-semibold">Domain owner contact details</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Domain providers require accurate owner information. Your signed-in email address is used automatically.</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ownerFields.map(([key, label, placeholder]) => <label key={key} className="space-y-2 text-sm font-medium"><span>{label}{key !== "organization" && <span className="text-destructive"> *</span>}</span><Input value={registrant[key]} placeholder={placeholder} onChange={(event) => setRegistrant((current) => ({ ...current, [key]: event.target.value }))} /></label>)}</div><label className="mt-5 flex min-h-11 items-start gap-3 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground"><input type="checkbox" checked={acceptRegistrarTerms} onChange={(event) => setAcceptRegistrarTerms(event.target.checked)} className="mt-1 size-4" /><span>I confirm these details are accurate and accept the <Link href="/legal/terms" className="font-medium text-primary underline">domain registration terms</Link>.</span></label></section>}

      <section className="mt-10" aria-labelledby="domain-results-title"><h2 id="domain-results-title" className="text-xl font-semibold">Search results</h2>{results.length > 0 ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{results.map((item) => <article key={item.domain} className="surface-card p-5"><div className="flex items-start justify-between gap-3"><span className="break-all font-semibold">{item.domain}</span><span className={`inline-flex items-center gap-1 text-sm font-medium ${item.available ? "text-emerald-600" : "text-muted-foreground"}`}>{item.available && <CheckCircle2 className="size-4" />}{item.available ? "Available" : "Unavailable"}</span></div><p className="mt-4 text-sm text-muted-foreground">{domainPriceNaira(item.priceCents)} for the first year</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Renewal pricing is shown before renewal is due.</p><div className="mt-4 grid gap-2"><Button disabled={!purchasesEnabled || !item.available || loading || !registrantReady} onClick={() => buy(item.domain, "wallet")}>{purchasesEnabled ? "Pay with wallet" : "Purchasing coming soon"}</Button><Button variant="secondary" disabled={!purchasesEnabled || !item.available || loading || !registrantReady} onClick={() => buy(item.domain, "paystack")}>{purchasesEnabled ? (linking ? "Pay securely and connect" : "Pay securely") : "Payments disabled"}</Button></div>{item.available && purchasesEnabled && !registrantReady && <p className="mt-3 text-xs text-muted-foreground">Complete the owner details above to continue.</p>}</article>)}</div> : <div className="mt-4 rounded-3xl border border-dashed px-6 py-14 text-center"><Search className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-medium">Start with a domain search</p><p className="mt-1 text-sm text-muted-foreground">Enter the full name you want, including .com, .app, or another ending.</p></div>}</section>
      <p className="mt-10 text-center text-sm text-muted-foreground">Already own or recently purchased a domain? <Link href="/dashboard/domains" className="font-medium text-primary hover:underline">View your domains</Link></p>
    </main>
  );
}
