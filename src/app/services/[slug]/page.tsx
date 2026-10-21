import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, ChevronRight, Star } from "lucide-react";

import { services, getServiceBySlug } from "@/lib/data/services";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ServiceVisual } from "@/components/marketing/service-visual";
import { BuyNowButton } from "@/components/marketing/buy-now-button";
import { WishlistButton } from "@/components/marketing/wishlist-button";
import { ServiceCard } from "@/components/marketing/service-card";
import { PremiumTemplateCatalog } from "@/components/premium-templates/premium-template-catalog";

function screenshotLabel(shot: string) {
  if (!shot.startsWith("/")) return shot;
  const name = (shot.split("/").pop() ?? shot).replace(/\.[^.]+$/, "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  return {
    title: service.name,
    description: service.description,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const related = services.filter((s) => s.slug !== service.slug && s.category === service.category).slice(0, 3);
  const isSupportTemplates = service.slug === "support-website-templates";
  const isPremiumTemplates = service.slug === "premium-templates";

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[420px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-brand opacity-10 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/services" className="hover:text-foreground">
              Services
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">{service.name}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="soft">{service.category}</Badge>
                {service.comingSoon && <Badge className="border-amber-300/30 bg-amber-300/15 text-amber-700 dark:text-amber-200">Coming soon</Badge>}
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                {service.name}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">{service.tagline}</p>

              {!service.comingSoon && <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{service.rating}</span>
                  <span className="text-muted-foreground">
                    ({service.reviewCount} reviews)
                  </span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="text-sm font-medium text-primary">Included with EazyTool All Access</div>
              </div>}

              <div className="mt-8 flex flex-wrap gap-3">
                {isSupportTemplates ? (
                  <Button size="lg" asChild>
                    <Link href="/support-templates">Browse Templates</Link>
                  </Button>
                ) : isPremiumTemplates ? (
                  <Button size="lg" asChild>
                    <Link href="#templates">Open Website Builder</Link>
                  </Button>
                ) : service.comingSoon ? (
                  <Button size="lg" disabled>Coming soon</Button>
                ) : (
                  <BuyNowButton
                    serviceSlug={service.slug}
                    serviceName={service.name}
                    size="lg"
                  />
                )}
                <WishlistButton slug={service.slug} />
              </div>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-primary/25 via-violet-500/10 to-cyan-400/20 p-2 shadow-[0_30px_90px_-35px_rgba(37,99,235,.55)]">
              <ServiceVisual
                variant={service.heroImage}
                chrome={false}
                className="aspect-[16/10] rounded-[1.55rem] border-white/15"
                label={`${service.name} feature preview`}
              />
            </div>
          </div>
        </div>
      </section>

      {isPremiumTemplates && <PremiumTemplateCatalog />}

      {/* Feature preview */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Made to be simple</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Features</h2>
          <p className="mt-3 leading-7 text-muted-foreground">{service.comingSoon ? "A preview of the features we are preparing. This tool is not available yet." : "See what you can do, then open the tool and follow the clear steps on screen. No technical experience is required."}</p>
        </div>
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.25fr_.75fr]">
          <div className={cn("grid gap-5", service.screenshots.length > 1 && "sm:grid-cols-2")}>
            {service.screenshots.map((shot, index) => (
              <figure key={shot} className={cn("overflow-hidden rounded-3xl border bg-card shadow-[0_24px_70px_-45px_rgba(59,130,246,.75)]", index === 0 && service.screenshots.length > 1 && "sm:col-span-2")}>
                <ServiceVisual variant={shot} chrome={false} className="aspect-[16/10] rounded-none border-0" label={screenshotLabel(shot)} />
                <figcaption className="border-t px-5 py-4">
                  <p className="font-semibold">{service.features[index] ?? service.name}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">A clear, responsive experience that works comfortably on phones, tablets and computers.</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="rounded-3xl border bg-primary/[0.045] p-5 sm:p-6">
            <h3 className="text-lg font-semibold">What you can do</h3>
            <ul className="mt-5 space-y-4">
              {service.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm leading-6">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Check className="size-3.5" /></span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features & Benefits */}
      <section className="border-y border-white/10 bg-white/[0.015] py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{service.comingSoon ? "Planned features" : "What’s included"}</h2>
            <p className="mt-2 text-muted-foreground">{service.description}</p>
            <ul className="mt-6 space-y-3">
              {service.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-brand-soft">
                    <Check className="size-3 text-primary" />
                  </span>
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Why it matters</h2>
            <div className="mt-6 space-y-4">
              {service.benefits.map((b, i) => (
                <div key={b} className="glass flex items-start gap-4 rounded-xl p-4">
                  <span className="text-gradient-brand text-xl font-semibold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm text-muted-foreground">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {!service.comingSoon && service.reviews.length > 0 && <section className="border-y border-white/10 bg-white/[0.015] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">Customer reviews</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {service.reviews.map((review) => (
              <div key={review.id} className="glass rounded-2xl p-6">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < review.rating
                          ? "size-4 fill-amber-400 text-amber-400"
                          : "size-4 text-muted-foreground/30"
                      }
                    />
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">&ldquo;{review.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback>{review.author[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{review.author}</div>
                    <div className="text-xs text-muted-foreground">{review.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>}

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="mt-8 space-y-3">
          {service.faq.map((item, i) => (
            <AccordionItem key={item.question} value={`item-${i}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">You might also like</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((s, i) => (
              <ServiceCard key={s.slug} service={s} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
