export interface PremiumSite {
  id: string;
  userId: string;
  templateId: "volterra-ev";
  name: string;
  slug: string;
  status: "draft" | "published";
  brandName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  primaryColor: string;
  announcement: string;
  createdAt: string;
  updatedAt: string;
}

export function createPremiumSite(userId: string): PremiumSite {
  const now = new Date().toISOString();
  const suffix = Math.random().toString(36).slice(2, 7);
  return {
    id: `premium_${Date.now()}_${suffix}`,
    userId,
    templateId: "volterra-ev",
    name: "Volterra EV Marketplace",
    slug: `volterra-${suffix}`,
    status: "draft",
    brandName: "Volterra",
    tagline: "The future moves with you",
    heroTitle: "Think ahead. Move electric.",
    heroSubtitle: "Explore simulated markets and discover a curated collection of electric vehicles in one modern platform.",
    contactPhone: "+234 800 000 0000",
    contactEmail: "hello@example.com",
    address: "Lagos, Nigeria",
    primaryColor: "#e82127",
    announcement: "Simulation only — no real funds, returns, payments, or vehicle deliveries.",
    createdAt: now,
    updatedAt: now,
  };
}
