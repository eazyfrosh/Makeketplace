import type { ReactNode } from "react";

import { LicenseGuard } from "@/components/platform/license-guard";

export default function WebsiteBuilderLayout({ children }: { children: ReactNode }) {
  return (
    <LicenseGuard serviceSlug="website-design" themeClass="">
      {children}
    </LicenseGuard>
  );
}
