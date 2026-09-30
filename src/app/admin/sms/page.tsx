"use client";
import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import type { SmsRecord } from "@/lib/sms/types";
type AdminSmsData = {
  messages: SmsRecord[];
  suspendedUsers: number;
  configuration: { trialMode: boolean; senderConfigured: boolean };
};
export default function AdminSmsPage() {
  const { isAdmin, loading } = useRequireAdmin();
  const [data, setData] = React.useState<AdminSmsData | null>(null);
  React.useEffect(() => {
    if (isAdmin)
      getAuthHeaders()
        .then((h) => fetch("/api/sms/admin/summary", { headers: h }))
        .then((r) => r.json())
        .then(setData);
  }, [isAdmin]);
  if (loading || !isAdmin || !data)
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <Link href="/admin" className="text-sm text-primary">
        ← Admin
      </Link>
      <h1 className="mt-2 text-3xl font-semibold">SMS Flashing</h1>
      <p className="mt-2 text-muted-foreground">
        Provider health and recent delivery activity. Credentials are never
        displayed.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card
          label="Twilio Status"
          value={
            data.configuration.trialMode ? "Trial Mode" : "Production Mode"
          }
        />
        <Card
          label="Sender"
          value={
            data.configuration.senderConfigured
              ? "Configured"
              : "Not configured"
          }
        />
        <Card label="Suspended users" value={String(data.suspendedUsers)} />
      </div>
      <div className="mt-8 overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4">Date</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Segments</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {data.messages.map((m) => (
              <tr className="border-t" key={m.id}>
                <td className="p-4">
                  {new Date(m.createdAt).toLocaleString()}
                </td>
                <td>{m.destination}</td>
                <td className="capitalize">{m.status}</td>
                <td>{m.segments}</td>
                <td>{m.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
