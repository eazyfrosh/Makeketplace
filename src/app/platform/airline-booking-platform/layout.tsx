import type { ReactNode } from "react";

import { LicenseGuard } from "@/components/platform/license-guard";

export default function AirlineBookingPlatformLayout({ children }: { children: ReactNode }) {
  return (
    <LicenseGuard serviceSlug="airline-booking-platform" themeClass="airline-theme">
      {children}
    </LicenseGuard>
  );
}
