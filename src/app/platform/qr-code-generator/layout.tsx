import type { ReactNode } from "react";

import { LicenseGuard } from "@/components/platform/license-guard";

export default function QrCodeGeneratorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LicenseGuard serviceSlug="qr-code-generator" themeClass="">
      {children}
    </LicenseGuard>
  );
}
