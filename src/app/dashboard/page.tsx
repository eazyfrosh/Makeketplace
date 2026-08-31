"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Download, FileText, KeyRound, Loader2, Package, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

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

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [licenses, setLicenses] = React.useState<MyLicense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [accessingSlug, setAccessingSlug] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  React.useEffect(() => {
    if (!user) return;
    getAuthHeaders().then((headers) => {
      fetch("/api/licenses/mine", { headers })
        .then((res) => (res.ok ? res.json() : { licenses: [] }))
        .then((data) => setLicenses(data.licenses ?? []))
        .finally(() => setLoading(false));
    });
  }, [user]);

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("License key copied");
  }

  async function handleAccess(license: MyLicense) {
    setAccessingSlug(license.serviceSlug);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/licenses/issue-access-token", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ serviceSlug: license.serviceSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Access denied.");
      window.location.href = data.redirectUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't grant access right now.");
    } finally {
      setAccessingSlug(null);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalSpent = licenses.reduce((sum, l) => sum + (l.orderTotalCents ?? 0), 0);
  const invoiceCount = new Set(licenses.map((l) => l.orderId)).size;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {user.name}</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your purchased services, downloads, and license keys.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <Link href="/dashboard/affiliate">Affiliate program</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/dashboard/profile">Account settings</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <Package className="size-5 text-primary" />
          <div className="mt-3 text-2xl font-semibold">{licenses.length}</div>
          <div className="text-sm text-muted-foreground">Purchased services</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <FileText className="size-5 text-primary" />
          <div className="mt-3 text-2xl font-semibold">{invoiceCount}</div>
          <div className="text-sm text-muted-foreground">Invoices</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <KeyRound className="size-5 text-primary" />
          <div className="mt-3 text-2xl font-semibold">{formatPrice(totalSpent)}</div>
          <div className="text-sm text-muted-foreground">Total spent</div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold">Your purchases</h2>

        {loading ? (
          <div className="mt-6 flex justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : licenses.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="No purchases yet"
            description="Browse our services and your orders will show up here."
            action={
              <Button asChild>
                <Link href="/services">Browse services</Link>
              </Button>
            }
          />
        ) : (
          <div className="mt-6 space-y-4">
            {licenses.map((license) => {
              const status = displayStatus(license);
              const canAccess = status === "Active";
              return (
                <div key={license.id} className="glass rounded-2xl p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{license.serviceName}</span>
                        <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Purchased {new Date(license.issuedAt).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => copyKey(license.licenseKey)}
                        className="mt-2 flex items-center gap-1.5 font-mono text-xs text-primary hover:underline"
                      >
                        {license.licenseKey}
                        <Copy className="size-3" />
                      </button>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {license.billing === "monthly" ? (
                          license.expiresAt ? (
                            <>Renews {new Date(license.expiresAt).toLocaleDateString()}</>
                          ) : (
                            "Monthly license"
                          )
                        ) : (
                          "Lifetime license — no renewal needed"
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        disabled={!canAccess || accessingSlug === license.serviceSlug}
                        onClick={() => handleAccess(license)}
                        title={canAccess ? undefined : `License is ${status.toLowerCase()}`}
                      >
                        {accessingSlug === license.serviceSlug ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : !canAccess ? (
                          <ShieldQuestion className="size-4" />
                        ) : null}
                        Access
                      </Button>
                      <Button variant="secondary" size="sm" disabled title="Not available for this service">
                        <Download className="size-4" />
                        Download
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/checkout/success?order=${license.orderId}`}>Invoice</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/support">Get support</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
