import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Globe2, LayoutTemplate, Mail, ShieldCheck } from "lucide-react";

const tools = [
  { icon: LayoutTemplate, label: "Build a website", detail: "Make it yours" },
  { icon: Mail, label: "Design an email", detail: "Preview before sending" },
  { icon: Globe2, label: "Find a domain", detail: "Grow your brand" },
];

export function AuthCard({
  title,
  description,
  children,
  footer,
  mode,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  mode: "login" | "signup";
}) {
  return (
    <div className="relative isolate overflow-hidden bg-[#f1f5ff] px-4 pb-24 pt-8 dark:bg-[#0c1020] sm:px-6 sm:py-14 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-12 size-96 rounded-full bg-sky-300/25 blur-3xl dark:bg-blue-500/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-500/10" />

      <div className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-card shadow-[0_25px_80px_-35px_rgba(28,42,95,0.45)] dark:border-white/10 lg:min-h-[650px] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden bg-[#09142d] p-10 text-white lg:flex lg:flex-col xl:p-14">
          <div aria-hidden="true" className="absolute -right-32 -top-32 size-[450px] rounded-full bg-blue-500/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-48 -left-24 size-[460px] rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="relative flex items-center justify-between">
            <Link href="/" aria-label="EazyTool home" className="inline-flex rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
              <Image src="/eazytools-logo-dark.png" alt="EazyTool" width={1040} height={700} className="h-auto w-28" priority />
            </Link>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-cyan-100">Your tools, together</span>
          </div>

          <div className="relative my-auto py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Welcome to EazyTool</p>
            <h2 className="mt-5 max-w-md text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              {mode === "login" ? "Pick up right where you left off." : "Your next idea starts here."}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300">
              Websites, email, domains and everyday business tools in one easy-to-use place.
            </p>

            <div className="mt-9 space-y-3">
              {tools.map(({ icon: Icon, label, detail }) => (
                <div key={label} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 backdrop-blur-sm">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200"><Icon className="size-5" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="block text-xs text-slate-300">{detail}</span></span>
                  <ArrowUpRight className="size-4 text-cyan-200/70" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>

          <p className="relative flex items-center gap-2 text-xs text-slate-300"><ShieldCheck className="size-4 text-cyan-300" aria-hidden="true" /> Your account stays protected as you work.</p>
        </div>

        <div className="flex min-w-0 flex-col justify-center px-6 py-9 sm:px-12 sm:py-14 xl:px-16">
          <Link href="/" aria-label="EazyTool home" className="mb-8 inline-flex w-fit rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary lg:hidden">
            <Image src="/eazytools-logo-light.png" alt="EazyTool" width={1040} height={700} className="h-auto w-24 dark:hidden" priority />
            <Image src="/eazytools-logo-dark.png" alt="EazyTool" width={1040} height={700} className="hidden h-auto w-24 dark:block" priority />
          </Link>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> {mode === "login" ? "Welcome back" : "Get started"}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
