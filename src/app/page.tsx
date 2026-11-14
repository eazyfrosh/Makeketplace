import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { FeaturedServices } from "@/components/home/featured-services";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { TrustSection } from "@/components/home/trust-section";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedServices />
      <WhyChooseUs />
      <TrustSection />
    </>
  );
}
