import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { FeaturedServices } from "@/components/home/featured-services";
import { HowItWorks } from "@/components/home/how-it-works";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { TrustSection } from "@/components/home/trust-section";
import { CTA } from "@/components/home/cta";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedServices />
      <HowItWorks />
      <WhyChooseUs />
      <TrustSection />
      <CTA />
    </>
  );
}
