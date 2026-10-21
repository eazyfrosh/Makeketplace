import Link from "next/link";
import type { ReactNode } from "react";
import { MessageSquareText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getServiceBySlug } from "@/lib/data/services";

export default function SmsLayout({ children }: { children: ReactNode }) {
  if (!getServiceBySlug("sms-messaging")?.comingSoon) return children;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <MessageSquareText className="size-8" aria-hidden="true" />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Coming soon</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">SMS Flashing</h1>
      <p className="mt-4 max-w-lg text-muted-foreground">
        We are preparing SMS Flashing. Sending messages is not available right now, and no SMS will be sent from this page.
      </p>
      <Button className="mt-7" asChild><Link href="/services">Explore other services</Link></Button>
    </main>
  );
}
