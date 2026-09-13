import type { ReactNode } from "react";

import { LicenseGuard } from "@/components/platform/license-guard";
import { ServiceContactWidgets } from "@/components/service-chat/service-contact-widgets";

export default function LogisticsPlatformLayout({ children }: { children: ReactNode }) {
  return (
    <LicenseGuard serviceSlug="logistics-platform" themeClass="logistics-theme carrier-theme">
      {children}
      <ServiceContactWidgets serviceSlug="logistics-platform" />
    </LicenseGuard>
  );
}
