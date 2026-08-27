"use client";

import * as React from "react";
import { Loader2, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { useRequireAdmin } from "@/hooks/use-require-admin";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { services } from "@/lib/data/services";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { License, LicenseValidationLog } from "@/types/licensing";

const STATUS_VARIANT: Record<License["status"], "default" | "outline" | "destructive"> = {
  active: "default",
  suspended: "outline",
  expired: "outline",
  revoked: "destructive",
};

export default function AdminLicensesPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin();
  const [licenses, setLicenses] = React.useState<License[]>([]);
  const [durable, setDurable] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [historyFor, setHistoryFor] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<LicenseValidationLog[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [grantEmail, setGrantEmail] = React.useState("");
  const [grantServiceSlug, setGrantServiceSlug] = React.useState(services[0]?.slug ?? "");
  const [granting, setGranting] = React.useState(false);

  const load = React.useCallback(async (q: string) => {
    setLoading(true);
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/licenses/admin-list?q=${encodeURIComponent(q)}`, { headers });
    const data = await res.json();
    setLicenses(data.licenses ?? []);
    setDurable(Boolean(data.durable));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (!isAdmin) return;
    load(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  React.useEffect(() => {
    if (!isAdmin) return;
    const timeout = setTimeout(() => load(query), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function callAction(path: string, body: Record<string, unknown>) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/licenses/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Action failed.");
    return data;
  }

  async function handleAction(license: License, action: "revoke" | "suspend" | "reactivate" | "renew") {
    if (action === "revoke" && !window.confirm(`Revoke the license for ${license.serviceName}? This is permanent.`)) {
      return;
    }
    setBusyId(license.id);
    try {
      if (action === "renew") {
        await callAction("renew", { licenseId: license.id, extendDays: 30 });
        toast.success("License renewed 30 days.");
      } else {
        await callAction(action, { licenseId: license.id });
        toast.success(`License ${action}d.`);
      }
      await load(query);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleGrant() {
    const email = grantEmail.trim();
    if (!email || !grantServiceSlug) return;
    setGranting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/licenses/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ email, serviceSlug: grantServiceSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Grant failed.");
      toast.success(`Granted ${data.license.serviceName} to ${email}.`);
      setGrantEmail("");
      await load(query);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Grant failed.");
    } finally {
      setGranting(false);
    }
  }

  async function toggleHistory(license: License) {
    if (historyFor === license.id) {
      setHistoryFor(null);
      return;
    }
    setHistoryFor(license.id);
    setHistoryLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/licenses/${license.id}`, { headers });
      const data = await res.json();
      setHistory(data.history ?? []);
    } finally {
      setHistoryLoading(false);
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">License management</h1>
      <p className="mt-2 text-muted-foreground">
        View every license, who owns it, and its status. Revoke, suspend, reactivate, or extend
        expiration.
      </p>

      {!durable && (
        <div className="glass mt-6 flex items-start gap-3 rounded-xl p-4 text-sm text-muted-foreground">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <p>
            Running without Firebase Admin credentials configured — licenses are held in server
            memory and reset on restart. Set FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY
            for durable production storage.
          </p>
        </div>
      )}

      <div className="glass mt-8 rounded-2xl p-5">
        <h2 className="font-semibold">Grant complimentary access</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Issue a free, active license to an existing account — no payment involved. The recipient
          must already have signed up with this email.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={grantEmail}
            onChange={(e) => setGrantEmail(e.target.value)}
            placeholder="customer@example.com"
            type="email"
            className="h-11 sm:max-w-xs"
          />
          <Select value={grantServiceSlug} onValueChange={setGrantServiceSlug}>
            <SelectTrigger className="h-11 sm:w-64">
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.slug} value={s.slug}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleGrant} disabled={granting || !grantEmail.trim()} className="h-11">
            {granting ? "Granting…" : "Grant free access"}
          </Button>
        </div>
      </div>

      <div className="relative mt-8 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email, service, or key…"
          className="h-11 pl-9"
        />
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : licenses.length === 0 ? (
        <EmptyState className="mt-12" title="No licenses found" description="Licenses appear here once customers purchase." />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((license) => (
                <React.Fragment key={license.id}>
                  <tr className="border-t border-white/10 align-top">
                    <td className="px-4 py-3">{license.userEmail}</td>
                    <td className="px-4 py-3">{license.serviceName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{license.licenseKey}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[license.status]} className="capitalize">
                        {license.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(license.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : "Lifetime"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === license.id}
                          onClick={() => toggleHistory(license)}
                        >
                          History
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === license.id || license.status === "active"}
                          onClick={() => handleAction(license, "reactivate")}
                        >
                          Reactivate
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === license.id || license.status !== "active"}
                          onClick={() => handleAction(license, "suspend")}
                        >
                          Suspend
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === license.id || license.status === "revoked"}
                          onClick={() => handleAction(license, "renew")}
                        >
                          +30d
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyId === license.id || license.status === "revoked"}
                          onClick={() => handleAction(license, "revoke")}
                        >
                          Revoke
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {historyFor === license.id && (
                    <tr className="border-t border-white/5 bg-white/[0.02]">
                      <td colSpan={7} className="px-4 py-4">
                        {historyLoading ? (
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : history.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No validation attempts logged yet.</p>
                        ) : (
                          <ul className="space-y-1.5 text-xs text-muted-foreground">
                            {history.map((h) => (
                              <li key={h.id} className="flex items-center gap-3">
                                <span className="w-40 shrink-0 font-mono">
                                  {new Date(h.createdAt).toLocaleString()}
                                </span>
                                <Badge
                                  variant={h.result === "granted" ? "default" : "outline"}
                                  className="capitalize"
                                >
                                  {h.result.replace(/_/g, " ")}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
