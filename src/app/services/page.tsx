import { Suspense } from "react";
import type { Metadata } from "next";

import { ServicesClient } from "./services-client";

export const metadata: Metadata = {
  title: "Services",
  description: "Browse EazyTool's digital products and professional services.",
};

export default function ServicesPage() {
  return (
    <Suspense>
      <ServicesClient />
    </Suspense>
  );
}
