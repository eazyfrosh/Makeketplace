import type { ReactNode } from "react";

import { LicenseGuard } from "@/components/platform/license-guard";
import { BankingAuthGate } from "@/components/banking/auth/banking-auth-gate";

export default function BankingPlatformLayout({ children }: { children: ReactNode }) {
  return (
    <LicenseGuard serviceSlug="banking-platform" themeClass="banking-theme">
      <BankingAuthGate>{children}</BankingAuthGate>
    </LicenseGuard>
  );
}
