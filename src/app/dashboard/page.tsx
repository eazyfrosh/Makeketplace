"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  FileText,
  HandCoins,
  KeyRound,
  Loader2,
  Package,
  Plus,
  ShieldQuestion,
  Sparkles,
  WalletCards,
  Globe2,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import type { Subscription, SubscriptionPlan } from "@/types/subscriptions";
import type { Service } from "@/types";
import { services } from "@/lib/data/services";

interface MyLicense {
  id: string;
  licenseKey: string;
  serviceSlug: string;
  serviceName: string;
  status: "active" | "suspended" | "expired" | "revoked";
  billing: "one-time" | "monthly";
  issuedAt: string;
  expiresAt: string | null;
  orderId: string;
  orderTotalCents: number | null;
}

function displayStatus(license: MyLicense): "Active" | "Suspended" | "Expired" | "Revoked" {
  if (license.status === "revoked") return "Revoked";
  if (license.status === "suspended") return "Suspended";
  if (license.expiresAt && new Date(license.expiresAt).getTime() < Date.now()) return "Expired";
  return "Active";
}

const STATUS_VARIANT: Record<string, "default" | "outline" | "destructive"> = {
  Active: "default",
  Suspended: "outline",
  Expired: "outline",
  Revoked: "destructive",
};

const QUICK_ACTIONS = [
  { href: "/services", label: "View services", description: "Explore tools and templates", icon: Package },
  { href: "/domains", label: "Buy a domain", description: "Find an address for your brand", icon: Globe2 },
  { href: "/wallet", label: "Fund your wallet", description: "Pay for eligible EazyTool services", icon: Plus },
  { href: "/dashboard/affiliate", label: "Earn with EazyTool", description: "Share EazyTool and track rewards", icon: HandCoins },
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [licenses, setLicenses] = React.useState<MyLicense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [accessingSlug, setAccessingSlug] = React.useState<string | null>(null);
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = React.useState<SubscriptionPlan | null>(null);

  React.useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [authLoading, user, router]);

  React.useEffect(() => {
    if (!user) return;
    getAuthHeaders().then((headers) => {
      Promise.all([
        fetch("/api/licenses/mine", { headers }).then((res) => (res.ok ? res.json() : { licenses: [] })),
        fetch("/api/subscriptions/me", { headers }).then((res) => (res.ok ? res.json() : { subscription: null, plan: null })),
      ])
        .then(([licenseData, subscriptionData]) => {
          setLicenses(licenseData.licenses ?? []);
          setSubscription(subscriptionData.subscription ?? null);
          setSubscriptionPlan(subscriptionData.plan ?? null);
        })
        .finally(() => setLoading(false));
    });
  }, [user]);

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("License key copied");
  }

  async function handleServiceAccess(service: Service) {
    setAccessingSlug(service.slug);
    try {
      if (service.slug === "support-website-templates") {
        router.push("/support-templates");
        return;
      }
      if (service.slug === "premium-templates") {
        router.push("/services/premium-templates#templates");
        return;
      }
      const headers = await getAuthHeaders();
      const res = await fetch("/api/licenses/issue-access-token", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ serviceSlug: service.slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Access denied.");
      window.location.href = data.redirectUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't open this service right now.");
    } finally {
      setAccessingSlug(null);
    }
  }

  if (authLoading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  const hasAllAccess = Boolean(
    subscription && ["active", "non_renewing"].includes(subscription.status) &&
    (!subscription.expiresAt || new Date(subscription.expiresAt).getTime() >= Date.now()) &&
    subscriptionPlan?.includedTools.includes("*"),
  );
  const totalSpent = licenses.reduce((sum, license) => sum + (license.orderTotalCents ?? 0), 0);
  const invoiceCount = new Set(licenses.map((license) => license.orderId)).size;
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-brand-soft p-6 sm:p-8 lg:p-10">
        <div className="relative z-10 max-w-3xl">
          <Badge variant="soft"><Sparkles className="size-3" /> Your EazyTool workspace</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back, {firstName}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Choose what you want to do next. Your tools, purchases, and account details are all in one place.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-primary/15 blur-3xl" />
      </section>

      <section className="mt-8" aria-labelledby="quick-actions-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Start here</p>
            <h2 id="quick-actions-heading" className="mt-1 text-xl font-semibold tracking-tight">What would you like to do?</h2>
          </div>
          <Link href="/support" className="hidden text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:block">Need help?</Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {QUICK_ACTIONS.map(({ href, label, description, icon: Icon }) => (
            <Link key={href} href={href} className="group flex min-h-36 flex-col justify-between rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
              <span className="mt-5"><span className="flex items-center gap-1 text-sm font-semibold">{label}<ArrowRight className="size-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" /></span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3" aria-label="Account summary">
        <div className="glass rounded-2xl p-5"><Package className="size-5 text-primary" /><div className="mt-3 text-2xl font-semibold">{hasAllAccess ? services.length : licenses.length}</div><div className="text-sm text-muted-foreground">Services you can use</div></div>
        <div className="glass rounded-2xl p-5"><FileText className="size-5 text-primary" /><div className="mt-3 text-2xl font-semibold">{invoiceCount}</div><div className="text-sm text-muted-foreground">Invoices available</div></div>
        <div className="glass rounded-2xl p-5"><KeyRound className="size-5 text-primary" /><div className="mt-3 text-2xl font-semibold">{formatPrice(totalSpent)}</div><div className="text-sm text-muted-foreground">Total spent</div></div>
      </section>

      <section className="mt-8 rounded-3xl border border-primary/20 bg-primary/[0.06] p-6 sm:p-8" aria-labelledby="subscription-heading">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><CheckCircle2 className="size-4" /> Access plan</div>
            <h2 id="subscription-heading" className="mt-2 text-2xl font-semibold">{subscriptionPlan?.name ?? "Free plan"}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {subscription ? `Your plan is ${subscription.status.replace("_", " ")}${subscription.nextBillingAt ? ` and renews on ${new Date(subscription.nextBillingAt).toLocaleDateString()}.` : "."}` : "Choose a subscription when you want access to more tools in one place."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild><Link href="/dashboard/billing">Manage plan</Link></Button>
            <Button asChild><Link href="/pricing">{subscription ? "Explore plans" : "View plans"}</Link></Button>
          </div>
        </div>
        {subscription?.usageLimit ? <div className="mt-7 max-w-2xl"><div className="flex items-center justify-between text-sm"><span>Usage this month</span><span className="text-muted-foreground">{subscription.usageThisMonth ?? 0} of {subscription.usageLimit} actions</span></div><Progress className="mt-3" value={Math.min(100, ((subscription.usageThisMonth ?? 0) / subscription.usageLimit) * 100)} /></div> : <p className="mt-6 text-sm text-muted-foreground">No usage limit is active on this plan.</p>}
      </section>

      <section className="mt-12" aria-labelledby="purchases-heading">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Your access</p><h2 id="purchases-heading" className="mt-1 text-xl font-semibold">Purchased services</h2></div><Link href="/services" className="text-sm font-medium text-primary hover:underline">Browse all services</Link></div>
        {loading ? <div className="mt-6 flex justify-center py-12"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div> : hasAllAccess ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {services.map((service) => <article key={service.slug} className="glass flex flex-col justify-between gap-5 rounded-2xl p-6"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{service.name}</h3><Badge>{service.comingSoon ? "Coming soon" : "Included"}</Badge></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{service.tagline}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" disabled={service.comingSoon || accessingSlug === service.slug} onClick={() => handleServiceAccess(service)}>{accessingSlug === service.slug ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}{service.comingSoon ? "Coming soon" : "Open service"}</Button><Button size="sm" variant="secondary" asChild><Link href={`/services/${service.slug}`}>View details</Link></Button></div></article>)}
          </div>
        ) : licenses.length === 0 ? <EmptyState className="mt-6" title="Nothing purchased yet" description="Your services and license keys will appear here after checkout." action={<Button asChild><Link href="/services">Browse services</Link></Button>} /> : (
          <div className="mt-6 space-y-4">{licenses.map((license) => { const status = displayStatus(license); const canAccess = status === "Active"; return <div key={license.id} className="glass rounded-2xl p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{license.serviceName}</span><Badge variant={STATUS_VARIANT[status]}>{status}</Badge></div><div className="mt-1 text-xs text-muted-foreground">Purchased {new Date(license.issuedAt).toLocaleDateString()}</div><button onClick={() => copyKey(license.licenseKey)} className="mt-3 flex max-w-full items-center gap-1.5 truncate font-mono text-xs text-primary hover:underline" title="Copy license key">{license.licenseKey}<Copy className="size-3 shrink-0" /></button><div className="mt-2 text-xs text-muted-foreground">{license.billing === "monthly" ? (license.expiresAt ? `Renews ${new Date(license.expiresAt).toLocaleDateString()}` : "Monthly license") : "Lifetime license — no renewal needed"}</div></div><div className="flex flex-wrap items-center gap-2"><Button size="sm" disabled={!canAccess || accessingSlug === license.serviceSlug} onClick={() => { const service = services.find((item) => item.slug === license.serviceSlug); if (service) void handleServiceAccess(service); }}>{accessingSlug === license.serviceSlug ? <Loader2 className="size-4 animate-spin" /> : !canAccess ? <ShieldQuestion className="size-4" /> : <ArrowRight className="size-4" />}{canAccess ? "Open service" : "Unavailable"}</Button><Button variant="ghost" size="sm" asChild><Link href={`/checkout/success?order=${license.orderId}`}>Invoice</Link></Button><Button variant="ghost" size="sm" asChild><Link href="/dashboard/support">Get support</Link></Button></div></div></div>; })}</div>
        )}
      </section>

      <div className="mt-8 flex items-center gap-2 rounded-2xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground sm:hidden"><WalletCards className="size-4 shrink-0 text-primary" /><span>Need to pay for a domain or service? <Link href="/wallet" className="font-medium text-primary underline">Add funds to your wallet</Link>.</span></div>
    </div>
  );
}
