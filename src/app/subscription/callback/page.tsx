import * as React from "react";

import { SubscriptionCallback } from "@/components/subscriptions/subscription-callback";

export default function SubscriptionCallbackPage() {
  return (
    <React.Suspense fallback={<div className="flex min-h-[55vh] items-center justify-center text-sm text-muted-foreground">Loading payment callback…</div>}>
      <SubscriptionCallback />
    </React.Suspense>
  );
}
