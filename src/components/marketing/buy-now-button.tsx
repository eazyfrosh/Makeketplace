import Link from "next/link";

import { Button } from "@/components/ui/button";

export function BuyNowButton({ size = "default", variant = "default", className }: {
  serviceSlug?: string;
  serviceName?: string;
  priceCents?: number;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "secondary";
  className?: string;
}) {
  return <Button size={size} variant={variant} className={className} asChild><Link href="/pricing">Get All Access</Link></Button>;
}
