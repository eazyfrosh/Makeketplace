import type { ReactNode } from "react";

import { LicenseGuard } from "@/components/platform/license-guard";

export default function BankingPlatformLayout({ children }: { children: ReactNode }) {
  return (
    <LicenseGuard serviceSlug="banking-platform" themeClass="banking-theme">
      {children}
    </LicenseGuard>
  );
}
