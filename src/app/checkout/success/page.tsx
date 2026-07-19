import { Suspense } from "react";

import { SuccessClient } from "./success-client";

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessClient />
    </Suspense>
  );
}
