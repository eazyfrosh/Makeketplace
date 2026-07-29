import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ShieldAlert, ShieldCheck } from "lucide-react";

import { getServiceBySlug } from "@/lib/data/services";
import { Button } from "@/components/ui/button";

/**
 * Reference implementation of an "external service" gate.
 *
 * This page stands in for a truly separate application (a different repo,
 * different domain, different stack). It only knows two things about the
 * marketplace: the shared signing secret's public validation endpoint, and
 * how to read the `token` query param it was redirected here with. Any real
 * external app follows the exact same contract:
 *
 *   1. User clicks "Access" in the marketplace dashboard.
 *   2. Marketplace calls POST /api/licenses/issue-access-token (server-side,
 *      authenticated) and redirects the browser to `${accessUrl}?token=...`.
 *   3. The external service — NOT trusting the marketplace UI or the token's
 *      contents on their own — calls POST /api/licenses/validate with the
 *      token and its own service slug, server-side, over HTTPS.
 *   4. Only a `{ valid: true }` response unlocks protected content. Any other
 *      response (expired/revoked/suspended/wrong-service/invalid) must deny
 *      access and send the user back to the marketplace.
 *
 * To point a real external site at this system: swap this page for a
 * server-side route in that app that performs step 3 against this
 * marketplace's `/api/licenses/validate` endpoint, and set that service's
 * `accessUrl` (src/lib/data/services.ts) to the real site's URL.
 */
export default async function AccessGatePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  if (!token) {
    return (
      <DeniedView
        serviceName={service.name}
        message="No access token was presented. Access this service from your dashboard."
      />
    );
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";

  let valid = false;
  let reason = "denied_invalid_token";
  try {
    const res = await fetch(`${protocol}://${host}/api/licenses/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, serviceSlug: slug }),
      cache: "no-store",
    });
    const data = await res.json();
    valid = Boolean(data.valid);
    reason = data.reason ?? reason;
  } catch {
    valid = false;
  }

  if (!valid) {
    const messages: Record<string, string> = {
      denied_expired: "This access link has expired. Return to your dashboard and click Access again.",
      denied_revoked: "Your license for this service has been revoked.",
      denied_suspended: "Your license for this service is currently suspended.",
      denied_service_mismatch: "This access link isn't valid for this service.",
      denied_not_found: "We couldn't find a matching license.",
      denied_invalid_token: "This access link is invalid.",
    };
    return (
      <DeniedView
        serviceName={service.name}
        message={messages[reason] ?? "Access denied."}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="glass w-full rounded-2xl p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15">
          <ShieldCheck className="size-7 text-emerald-400" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Access granted</h1>
        <p className="mt-2 text-muted-foreground">
          Your license for <span className="text-foreground">{service.name}</span> was validated by the
          shared licensing backend. This page stands in for that service&apos;s own protected
          application.
        </p>
        <Button className="mt-8" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

function DeniedView({ serviceName, message }: { serviceName: string; message: string }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="glass w-full rounded-2xl p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/15">
          <ShieldAlert className="size-7 text-destructive" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Access denied</h1>
        <p className="mt-2 text-muted-foreground">
          {message} You don&apos;t have access to <span className="text-foreground">{serviceName}</span>{" "}
          right now.
        </p>
        <Button className="mt-8" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
