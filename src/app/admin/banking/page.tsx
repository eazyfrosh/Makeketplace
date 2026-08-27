"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";

import { useRequireAdmin } from "@/hooks/use-require-admin";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import { formatCurrency } from "@/lib/banking/format";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

interface BankingUserSummary {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  accountStatus: "active" | "frozen" | "closed" | null;
  balance: number | null;
  currency: string | null;
}

export default function AdminBankingPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin();
  const [users, setUsers] = React.useState<BankingUserSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");

  const load = React.useCallback(async (q: string) => {
    setLoading(true);
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/banking/admin/users?q=${encodeURIComponent(q)}`, { headers });
    const data = await res.json();
    setUsers(data.users ?? []);
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

  if (authLoading || !isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Banking users</h1>
      <p className="mt-2 text-muted-foreground">
        Everyone who has signed up for the Banking Platform. Open a user to view their account,
        card status, and transactions for support purposes.
      </p>

      <div className="relative mt-8 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="h-11 pl-9"
        />
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          className="mt-12"
          title="No banking users found"
          description="Users appear here once they sign up for the Banking Platform."
        />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Account status</th>
                <th className="px-4 py-3 font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.userId}
                  className="cursor-pointer border-t border-white/10 hover:bg-white/[0.02]"
                  onClick={() => (window.location.href = `/admin/banking/${u.userId}`)}
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/banking/${u.userId}`} className="hover:underline">
                      {u.firstName} {u.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.accountStatus ? (
                      <Badge variant={u.accountStatus === "active" ? "default" : "outline"} className="capitalize">
                        {u.accountStatus}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.balance !== null ? formatCurrency(u.balance, u.currency ?? "USD") : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
