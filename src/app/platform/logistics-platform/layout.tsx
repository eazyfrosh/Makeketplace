import type { ReactNode } from "react";

import { LicenseGuard } from "@/components/platform/license-guard";

export default function LogisticsPlatformLayout({ children }: { children: ReactNode }) {
  return (
    <LicenseGuard serviceSlug="logistics-platform" themeClass="logistics-theme carrier-theme">
      {children}
    </LicenseGuard>
  );
}
