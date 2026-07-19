"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AtSign, Link2, MessageCircle, Send } from "lucide-react";

import { Input } from "@/components/ui/input";
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
  const [email, setEmail] = React.useState("");

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("You're subscribed! Watch your inbox for launches and deals.");
    setEmail("");
  }

  return (
    <footer className="relative border-t border-white/10">
      <div className="bg-gradient-brand-soft absolute inset-x-0 top-0 h-px" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-brand text-sm font-bold text-white">
                N
              </span>
              <span className="text-lg font-semibold tracking-tight">Nexova</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The central hub for premium digital products and services — platforms,
              design, AI automation, and custom engineering, built to launch.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[AtSign, Link2, MessageCircle].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="glass flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Social link"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
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

        <div className="mt-14 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">Stay in the loop</h3>
            <p className="text-sm text-muted-foreground">
              New launches, deals, and product updates — no spam.
            </p>
          </div>
          <form onSubmit={subscribe} className="flex w-full max-w-sm gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-11"
            />
            <Button type="submit" size="default" className="shrink-0">
              <Send className="size-4" />
              Subscribe
            </Button>
          </form>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Nexova. All rights reserved.</p>
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
