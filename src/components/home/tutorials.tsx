"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, Laptop, PlayCircle, Smartphone, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Add a normal YouTube URL to youtubeUrl and a YouTube Shorts URL to youtubeShortsUrl when each tutorial is ready to publish.
const TUTORIALS = [
  { title: "EazyTool from start to finish", description: "Learn how to find a tool, create your work, preview the result, and manage everything from your account.", image: "/hero/showcase-launch.png", youtubeUrl: "https://youtu.be/84iecZfsqdw", youtubeShortsUrl: "https://www.youtube.com/shorts/sQ0XASqiPXI", featured: true },
  { title: "Subscribe to EazyTool", description: "Learn how to compare plans, choose the subscription that fits your needs, and complete your payment safely.", image: "/service-previews/premium-templates.png", serviceHref: "/pricing", youtubeUrl: "", youtubeShortsUrl: "https://youtube.com/shorts/7BW-jO1b9-0?si=ue1SxYO7EL1GGqbu" },
  { title: "Website Builder", description: "See how to choose a template, edit your website, and prepare it for publishing.", image: "/service-previews/website-builder-showcase.png", serviceHref: "/services/premium-templates", youtubeUrl: "", youtubeShortsUrl: "" },
  { title: "Email Designer", description: "Learn how to create a professional email, preview it, and prepare it for sending.", image: "/service-previews/email-designer-v3.png", serviceHref: "/services/email-designer", youtubeUrl: "", youtubeShortsUrl: "" },
  { title: "Flight Itinerary Booking", description: "Follow the steps for creating a clear itinerary and downloading the finished document.", image: "/service-previews/flight-itinerary-showcase.png", serviceHref: "/services/airline-booking-platform", youtubeUrl: "", youtubeShortsUrl: "" },
  { title: "Tracking Page", description: "Learn how to create shipments, share tracking details, and update delivery progress.", image: "/services/logistics/logistics-website-showcase-branded.png", serviceHref: "/services/logistics-platform", youtubeUrl: "", youtubeShortsUrl: "" },
  { title: "Receipt Generator", description: "See how to choose a template, edit the details, preview your receipt, and export it.", image: "/service-previews/receipt-generator-showcase.png", serviceHref: "/services/receipt-generator", youtubeUrl: "", youtubeShortsUrl: "" },
  { title: "Support Websites", description: "Learn how to customize a help website, add your branding, and publish it for customers.", image: "/service-previews/support-website-showcase.png", serviceHref: "/services/support-website-templates", youtubeUrl: "", youtubeShortsUrl: "" },
  { title: "QR Code Generator", description: "Create a QR code for a link or contact detail and download it when it is ready.", image: "/service-previews/qr-code-showcase.png", serviceHref: "/services/qr-code-generator", youtubeUrl: "", youtubeShortsUrl: "" },
];

type Tutorial = (typeof TUTORIALS)[number];

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const videoId = parsed.hostname.includes("youtu.be")
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get("v") ?? parsed.pathname.split("/").pop();
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : "";
  } catch {
    return "";
  }
}

function TutorialViewer({ tutorial, children }: { tutorial: Tutorial; children: ReactNode }) {
  const [deviceMode, setDeviceMode] = React.useState<"laptop" | "mobile">("laptop");
  const selectedVideoUrl = deviceMode === "mobile" ? tutorial.youtubeShortsUrl : tutorial.youtubeUrl;
  const embedUrl = selectedVideoUrl ? getYouTubeEmbedUrl(selectedVideoUrl) : "";

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className={`max-h-[92vh] w-[calc(100%-2rem)] overflow-y-auto p-0 ${deviceMode === "mobile" ? "max-w-lg" : "max-w-4xl"}`}>
        <div className="p-5 pb-0 sm:p-6 sm:pb-0">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle>{tutorial.title}</DialogTitle>
            <DialogDescription>{tutorial.description}</DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex w-full rounded-xl border bg-muted/50 p-1" aria-label="Choose your device view">
            <button type="button" onClick={() => setDeviceMode("laptop")} aria-pressed={deviceMode === "laptop"} className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${deviceMode === "laptop" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Laptop className="size-4" /> Laptop / Desktop</button>
            <button type="button" onClick={() => setDeviceMode("mobile")} aria-pressed={deviceMode === "mobile"} className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${deviceMode === "mobile" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Smartphone className="size-4" /> Mobile phone</button>
          </div>
        </div>
        <div className={`mt-5 flex w-full justify-center overflow-hidden bg-slate-950 ${deviceMode === "mobile" ? "px-5 py-5 sm:px-8" : "aspect-video"}`}>
          <div className={`${deviceMode === "mobile" ? "aspect-[9/16] max-h-[62vh] w-full max-w-[21rem] overflow-hidden rounded-2xl ring-1 ring-white/10" : "h-full w-full"}`}>
          {embedUrl ? (
            <iframe
              className="h-full w-full"
              src={embedUrl}
              title={`${tutorial.title} ${deviceMode === "mobile" ? "Shorts" : "video"} tutorial`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white">
              <PlayCircle className="size-12 text-cyan-300" />
              <p className="mt-4 text-lg font-semibold">This {deviceMode === "mobile" ? "Shorts" : "long-form"} tutorial is coming soon</p>
              <p className="mt-2 max-w-md text-sm text-white/65">We are preparing the {deviceMode === "mobile" ? "short mobile guide" : "full step-by-step guide"} for this service. Check back soon for the video.</p>
            </div>
          )}
          </div>
        </div>
        {tutorial.serviceHref && (
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="text-sm text-muted-foreground">Want to try it now? Open the service in a new step.</p>
            <Button asChild variant="outline" className="shrink-0">
              <Link href={tutorial.serviceHref}>Open service <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  return (
    <TutorialViewer tutorial={tutorial}>
      <button type="button" className="group w-full overflow-hidden rounded-2xl border border-border/70 bg-card text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <Image src={tutorial.image} alt={`${tutorial.title} tutorial preview`} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover object-top transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"><PlayCircle className="size-3.5" />Watch Tutorial</span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3"><h3 className="font-semibold leading-6">{tutorial.title}</h3><Video className="size-5 shrink-0 text-primary" /></div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{tutorial.description}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Watch Tutorial <ArrowRight className="size-3.5" /></span>
        </div>
      </button>
    </TutorialViewer>
  );
}

export function Tutorials() {
  const featured = TUTORIALS[0];

  return (
    <section id="tutorials" className="scroll-mt-24 border-y border-border/70 bg-background/45 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><BookOpen className="size-4" /> Tutorials &amp; help</span><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Learn EazyTool one step at a time.</h2></div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">Watch a quick guide for the whole workspace or open a service tutorial when you need help with one specific task.</p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_1.95fr]">
          <TutorialViewer tutorial={featured}>
            <article className="group cursor-pointer overflow-hidden rounded-3xl border border-primary/25 bg-primary/[0.06] text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="relative aspect-[16/10] overflow-hidden"><Image src={featured.image} alt="EazyTool full website tutorial preview" fill sizes="(min-width: 1024px) 35vw, 100vw" className="object-cover object-top transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" /><span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-950">Start here</span><div className="absolute inset-x-5 bottom-5 text-white"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Full website guide</p><h3 className="mt-2 text-2xl font-semibold">{featured.title}</h3></div></div>
              <div className="p-5"><p className="text-sm leading-6 text-muted-foreground">{featured.description}</p><span className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium">Watch Tutorial <PlayCircle className="size-4" /></span></div>
            </article>
          </TutorialViewer>
          <div className="grid gap-4 sm:grid-cols-2">{TUTORIALS.slice(1).map((tutorial) => <TutorialCard key={tutorial.title} tutorial={tutorial} />)}</div>
        </div>
      </div>
    </section>
  );
}
