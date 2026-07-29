import { Suspense } from "react";

import { CheckoutCallbackClient } from "./callback-client";

export default function CheckoutCallbackPage() {
  return (
    <Suspense>
      <CheckoutCallbackClient />
    </Suspense>
  );
}
