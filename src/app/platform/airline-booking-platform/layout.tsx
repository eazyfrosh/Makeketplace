import type { ReactNode } from "react";

import { LicenseGuard } from "@/components/platform/license-guard";
import { ServiceContactWidgets } from "@/components/service-chat/service-contact-widgets";

export default function AirlineBookingPlatformLayout({ children }: { children: ReactNode }) {
  return (
    <LicenseGuard serviceSlug="airline-booking-platform" themeClass="airline-theme">
      {children}
      <ServiceContactWidgets serviceSlug="airline-booking-platform" />
    </LicenseGuard>
  );
}
