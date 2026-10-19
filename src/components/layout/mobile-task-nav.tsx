"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Grid2X2, Home, LayoutDashboard, LogIn, WalletCards } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

export function MobileTaskNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/access/") ||
    pathname.startsWith("/v/") ||
    pathname.startsWith("/verify-")
  ) {
    return null;
  }

  const items = [
    { href: "/", label: "Home", icon: Home, exact: true },
    { href: "/services", label: "Tools", icon: Grid2X2 },
    ...(user ? [{ href: "/wallet", label: "Wallet", icon: WalletCards }] : []),
    {
      href: user ? "/dashboard" : "/auth/login",
      label: user ? "My account" : "Log in",
      icon: user ? LayoutDashboard : LogIn,
    },
    { href: "/contact", label: "Help", icon: CircleHelp },
  ];

  return (
    <>
      <div className="h-20 lg:hidden" aria-hidden="true" />
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-3 bottom-3 z-[65] rounded-2xl border border-white/10 bg-background/90 p-1.5 shadow-[0_18px_60px_-20px_rgba(0,0,0,.65)] backdrop-blur-xl lg:hidden"
      >
        <div className={cn("grid", items.length === 5 ? "grid-cols-5" : "grid-cols-4")}>
          {items.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold text-muted-foreground transition-colors",
                  active ? "bg-primary/12 text-primary" : "hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
