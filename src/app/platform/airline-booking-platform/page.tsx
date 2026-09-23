import Link from "next/link";
import { ArrowRight, Check, Globe2, MapPin, MessageCircle, Plane, ShieldCheck, Ticket } from "lucide-react";
import { AirlinesSection } from "@/components/airline/home/airlines-section";
import { SearchWidget } from "@/components/airline/search/search-widget";

const benefits = [
  { icon: Globe2, label: "9,000+ airports" },
  { icon: Plane, label: "Choose any airline" },
  { icon: ShieldCheck, label: "Manage trips anytime" },
];

export default function AirlineBookingPlatformHome() {
  return (
    <>
      <div className="relative isolate overflow-hidden bg-[#071a36] pb-20 text-white sm:pb-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-12rem] top-[-16rem] h-[36rem] w-[36rem] rounded-full bg-brand-500/30 blur-[110px]" />
        <div className="absolute right-[-10rem] top-10 h-[30rem] w-[30rem] rounded-full bg-cyan-400/15 blur-[100px]" />
        <div className="absolute bottom-[-16rem] left-1/2 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-gold-500/15 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:54px_54px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.12fr_.88fr] lg:gap-16">
          <div>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-[4.4rem]">
              The world is closer than you think.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
              Search any airport, choose the airline you want, and build a trip that feels completely yours.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href="#search-widget" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#071a36] shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:bg-brand-50">
                Start your search <ArrowRight size={16} />
              </a>
              <Link href="/platform/airline-booking-platform/trips" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10">
                <Ticket size={15} /> View my trips
              </Link>
              <Link href="/platform/airline-booking-platform/chat-widgets" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10">
                <MessageCircle size={15} /> Chat settings
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs text-white/65 sm:text-sm">
              {benefits.map((benefit) => (
                <span key={benefit.label} className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8 text-gold-400"><benefit.icon size={13} /></span>
                  {benefit.label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-brand-400/25 via-transparent to-gold-400/15 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.09] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">
              <div className="flex items-start justify-between">
                <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Your next escape</p><p className="mt-1 text-lg font-semibold">Lagos to London</p></div>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-200">Direct</span>
              </div>
              <div className="mt-8 grid grid-cols-[auto_1fr_auto] items-center gap-4">
                <div><p className="text-4xl font-bold tracking-tight">LOS</p><p className="mt-1 text-xs text-white/50">Lagos</p></div>
                <div className="relative"><div className="border-t border-dashed border-white/30" /><span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-700 shadow-lg"><Plane size={17} className="rotate-45" /></span></div>
                <div className="text-right"><p className="text-4xl font-bold tracking-tight">LHR</p><p className="mt-1 text-xs text-white/50">London</p></div>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-2 rounded-2xl bg-black/15 p-3">
                <div><p className="text-[10px] uppercase tracking-wide text-white/40">Departure</p><p className="mt-1 text-xs font-semibold">14 Oct</p></div>
                <div className="border-x border-white/10 px-3"><p className="text-[10px] uppercase tracking-wide text-white/40">Travelers</p><p className="mt-1 text-xs font-semibold">2 adults</p></div>
                <div className="pl-2"><p className="text-[10px] uppercase tracking-wide text-white/40">Cabin</p><p className="mt-1 text-xs font-semibold">Business</p></div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-white/50 bg-white px-4 py-3 text-[#071a36] shadow-xl sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check size={16} /></span>
              <div><p className="text-[10px] font-medium text-slate-400">Booking ready</p><p className="text-xs font-bold">All details, your choice</p></div>
            </div>
            <MapPin className="absolute -right-6 -top-7 hidden text-gold-400/60 sm:block" size={42} strokeWidth={1.2} />
          </div>
        </div>
      </div>

      <div id="search-widget" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
        <p className="mb-3 px-2 text-xs text-white/55">Search flights and customize your itinerary</p>
        <SearchWidget />
      </div>
      </div>
      <div className="bg-background text-foreground">
        <AirlinesSection />
      </div>
    </>
  );
}
