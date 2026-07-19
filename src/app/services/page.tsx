import { Suspense } from "react";
import type { Metadata } from "next";

import { ServicesClient } from "./services-client";

export const metadata: Metadata = {
  title: "Services",
  description: "Browse every premium digital product and service Nexova offers.",
};

export default function ServicesPage() {
  return (
    <Suspense>
      <ServicesClient />
    </Suspense>
  );
}
