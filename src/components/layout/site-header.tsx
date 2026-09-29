"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HandCoins, LayoutDashboard, Menu, Search, WalletCards, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WalletNavLink } from "@/components/wallet/wallet-nav-link";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/domains", label: "Domains" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Support" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const { user, logout } = useAuth();

  React.useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/services?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass border-b border-white/10">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="EazyTool home">
            <Image src="/eazytools-logo-light.png" alt="EazyTool" width={1040} height={736} priority className="h-11 w-auto max-w-[132px] object-contain dark:hidden sm:h-14 sm:max-w-[160px]" />
            <Image src="/eazytools-logo-dark.png" alt="EazyTool" width={1040} height={736} priority className="hidden h-11 w-auto max-w-[132px] object-contain dark:block sm:h-14 sm:max-w-[160px]" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={cn("rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", active && "bg-accent text-foreground")}>{link.label}</Link>;
            })}
          </nav>

          <div className="hidden max-w-sm flex-1 md:flex">
            <form onSubmit={submitSearch} className="relative w-full" role="search">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools and services" aria-label="Search tools and services" className="h-10 pl-9" />
            </form>
          </div>

          <div className="flex items-center gap-1">
            {user && <div className="hidden xl:block"><WalletNavLink /></div>}
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" aria-expanded={searchOpen} onClick={() => setSearchOpen((value) => !value)}><Search className="size-4" /></Button>
            <ThemeToggle />
            <div className="hidden sm:block">
              {user ? <DropdownMenu>
                <DropdownMenuTrigger asChild><button className="ml-1 flex items-center gap-2 rounded-full pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open account menu"><Avatar className="size-8"><AvatarFallback>{user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback></Avatar><span className="hidden max-w-24 truncate text-sm font-medium lg:block">{user.name?.split(" ")[0] ?? "Account"}</span></button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild><Link href="/dashboard"><LayoutDashboard className="size-4" />Dashboard</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/dashboard/affiliate"><HandCoins className="size-4" />Affiliate program</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/dashboard/profile">Account settings</Link></DropdownMenuItem>
                  {user.role === "admin" && <DropdownMenuItem asChild><Link href="/admin">Admin area</Link></DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <div className="ml-1 flex items-center gap-2"><Button variant="ghost" size="sm" asChild><Link href="/auth/login">Log in</Link></Button><Button size="sm" asChild><Link href="/auth/signup">Get started</Link></Button></div>}
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}</Button>
          </div>
        </div>

        {searchOpen && <div className="border-t border-white/10 p-3 md:hidden"><form onSubmit={submitSearch} className="relative" role="search"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools and services" aria-label="Search tools and services" className="h-11 pl-9" /></form></div>}
      </div>

      {mobileOpen && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass border-b border-white/10 lg:hidden"><nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6" aria-label="Mobile navigation">
        {NAV_LINKS.map((link) => { const active = isActive(pathname, link.href); return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={cn("rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground", active && "bg-accent text-foreground")}>{link.label}</Link>; })}
        <div className="my-2 h-px bg-border" />
        {user ? <><Link href="/dashboard" className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium"><LayoutDashboard className="size-4 text-primary" />Dashboard</Link><Link href="/wallet" className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium"><WalletCards className="size-4 text-primary" />Wallet</Link><Link href="/dashboard/affiliate" className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium"><HandCoins className="size-4 text-primary" />Affiliate program</Link><Link href="/dashboard/profile" className="rounded-xl px-3 py-3 text-sm font-medium">Account settings</Link><button onClick={() => logout()} className="rounded-xl px-3 py-3 text-left text-sm font-medium text-muted-foreground">Log out</button></> : <div className="flex gap-2 px-1 pt-1"><Button variant="secondary" size="sm" asChild className="flex-1"><Link href="/auth/login">Log in</Link></Button><Button size="sm" asChild className="flex-1"><Link href="/auth/signup">Get started</Link></Button></div>}
      </nav></motion.div>}
    </header>
  );
}
