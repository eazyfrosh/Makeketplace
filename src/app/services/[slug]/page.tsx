import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, ChevronRight, Star } from "lucide-react";

import { services, getServiceBySlug } from "@/lib/data/services";
import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
              <Badge variant="soft">{service.category}</Badge>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                {service.name}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">{service.tagline}</p>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{service.rating}</span>
                  <span className="text-muted-foreground">
                    ({service.reviewCount} reviews)
                  </span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="text-sm text-muted-foreground">
                  Price{" "}
                  <span className="font-semibold text-foreground">
                    {formatPrice(service.startingPriceCents)}
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <BuyNowButton
                  serviceSlug={service.slug}
                  serviceName={service.name}
                  priceCents={service.startingPriceCents}
                  size="lg"
                />
                <WishlistButton slug={service.slug} />
              </div>
            </div>

            <ServiceVisual
              variant={service.heroImage}
              className="aspect-[4/3]"
              label={`nexova.io/${service.slug}`}
            />
          </div>
        </div>
      </section>

      {/* Screenshots */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight">Product screenshots</h2>
        <div
          className={cn(
            "mt-6 grid gap-6",
            service.screenshots.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
          )}
        >
          {service.screenshots.map((shot) => (
            <ServiceVisual key={shot} variant={shot} className="aspect-video" label={screenshotLabel(shot)} />
          ))}
        </div>
      </section>

      {/* Features & Benefits */}
      <section className="border-y border-white/10 bg-white/[0.015] py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">What&apos;s included</h2>
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
      <section className="border-y border-white/10 bg-white/[0.015] py-16">
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
      </section>

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
