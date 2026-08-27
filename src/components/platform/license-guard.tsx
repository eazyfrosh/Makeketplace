"use client";

import type { ReactNode } from "react";

import { useRequireLicense } from "@/hooks/use-require-license";

/**
 * Wraps a ported platform's pages: redirects away unless the signed-in user
 * holds an active license for `serviceSlug`, and applies that platform's own
 * scoped theme class (see src/app/platform/platform-themes.css) so its
 * ported components render with their original visual identity instead of
 * Nexova's own theme.
 */
export function LicenseGuard({
  serviceSlug,
  themeClass,
  children,
}: {
  serviceSlug: string;
  themeClass: string;
  children: ReactNode;
}) {
  const { checking, hasAccess } = useRequireLicense(serviceSlug);

  if (checking) {
    return (
      <div className={themeClass}>
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <p className="text-sm opacity-70">Checking your access…</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) return null;

  return <div className={themeClass}>{children}</div>;
}
