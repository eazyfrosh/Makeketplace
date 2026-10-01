import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { categories } from "@/lib/data/services";

const FOOTER_LINKS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "All services", href: "/services" },
      { label: "Deals", href: "/deals" },
      { label: "Pricing", href: "/services" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Support tickets", href: "/dashboard/support" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign up", href: "/auth/signup" },
      { label: "Log in", href: "/auth/login" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10">
      <div className="bg-gradient-brand-soft absolute inset-x-0 top-0 h-px" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/eazytools-logo-light.png" alt="EazyTool" width={1040} height={736} className="h-20 w-auto max-w-[220px] object-contain dark:hidden" />
              <Image src="/eazytools-logo-dark.png" alt="EazyTool" width={1040} height={736} className="hidden h-20 w-auto max-w-[220px] object-contain dark:block" />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Practical digital tools and services for professionals who value speed,
              accuracy, and control.
            </p>
            <Button className="mt-6" variant="secondary" asChild><Link href="/contact"><CircleHelp className="size-4" />Get help</Link></Button>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold">Categories</h3>
            <ul className="mt-4 space-y-3">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/services?category=${c.id}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Need help choosing your next step?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us what you want to create, and we will point you in the right direction.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row"><Button variant="secondary" asChild><Link href="/#how-it-works">See how it works</Link></Button><Button asChild><Link href="/contact">Contact support<ArrowRight className="size-4" /></Link></Button></div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} EazyTool. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/legal/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/legal/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
