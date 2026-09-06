import { Hero } from "@/components/home/hero";
import { FeaturedServices } from "@/components/home/featured-services";
import { HowItWorks } from "@/components/home/how-it-works";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { TrustSection } from "@/components/home/trust-section";
import { CTA } from "@/components/home/cta";

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
