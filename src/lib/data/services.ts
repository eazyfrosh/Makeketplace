import type { Service, ServiceCategory, Testimonial } from "@/types";

export const categories: { id: ServiceCategory; label: string }[] = [
  { id: "platforms", label: "Platforms" },
  { id: "design", label: "Design" },
  { id: "ai", label: "AI & Automation" },
  { id: "templates", label: "Templates" },
  { id: "development", label: "Development" },
];

const standardFaq = (name: string) => [
  {
    question: `How long does it take to launch a ${name.toLowerCase()}?`,
    answer:
      "Most engagements kick off within 48 hours of purchase. Timeline depends on the package: Starter builds ship in 1-2 weeks, Growth in 3-5 weeks, and Enterprise scopes are timelined during onboarding.",
  },
  {
    question: "Do I own the source code?",
    answer:
      "Yes. Every package includes full source code ownership and transferable IP once the final invoice is paid in full.",
  },
  {
    question: "What happens after purchase?",
    answer:
      "You'll get access to your Customer Dashboard immediately, a kickoff questionnaire, and a dedicated delivery timeline. Support tickets and updates are tracked in one place.",
  },
  {
    question: "Can I upgrade my package later?",
    answer:
      "Absolutely — you can upgrade to a higher tier at any time and we'll credit what you've already paid toward the difference.",
  },
];

const standardReviews = [
  {
    id: "r1",
    author: "Maya Chen",
    role: "Founder",
    rating: 5,
    quote: "The delivery was faster than promised and the quality was miles above agencies we'd worked with before.",
  },
  {
    id: "r2",
    author: "Daniel Osei",
    role: "Head of Product",
    rating: 5,
    quote: "Clean architecture, great documentation, and a support team that actually responds.",
  },
  {
    id: "r3",
    author: "Priya Nair",
    role: "CTO",
    rating: 4,
    quote: "Exactly the premium feel we needed for launch. A couple of rounds of revisions and it was perfect.",
  },
];

function buildPackages(base: number): Service["packages"] {
  return [
    {
      id: "starter",
      name: "Starter",
      tagline: "For MVPs and quick launches",
      priceCents: base,
      billing: "one-time",
      features: [
        "Core feature set",
        "Responsive design",
        "Basic analytics",
        "14 days of support",
        "1 revision round",
      ],
    },
    {
      id: "growth",
      name: "Growth",
      tagline: "Most popular for scaling teams",
      priceCents: base * 2.6,
      billing: "one-time",
      featured: true,
      features: [
        "Everything in Starter",
        "Advanced integrations",
        "Custom branding",
        "60 days of priority support",
        "3 revision rounds",
        "Dedicated onboarding",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      tagline: "For complex, high-scale needs",
      priceCents: base * 5.5,
      billing: "one-time",
      features: [
        "Everything in Growth",
        "Dedicated engineering pod",
        "SLA-backed support",
        "Unlimited revisions",
        "White-glove migration",
        "Quarterly strategy reviews",
      ],
    },
  ];
}

export const services: Service[] = [
  {
    slug: "banking-platform",
    name: "Banking Platform",
    category: "platforms",
    tagline: "Full-stack digital banking, built for scale and compliance.",
    description:
      "A production-grade digital banking platform with accounts, cards, transfers, and compliance tooling baked in — the same foundation neobanks use to launch in weeks, not years.",
    heroImage: "banking",
    screenshots: ["banking-dashboard", "banking-cards", "banking-transfers"],
    features: [
      "Multi-currency accounts & ledgers",
      "Virtual & physical card issuance",
      "Instant transfers and payment rails",
      "KYC/AML compliance workflows",
      "Real-time fraud detection",
      "Admin & compliance dashboards",
    ],
    benefits: [
      "Launch a compliant banking product in weeks",
      "Bank-grade encryption and audit trails",
      "Scales from thousands to millions of accounts",
      "Pre-built integrations with major payment processors",
    ],
    startingPriceCents: 899900,
    rating: 4.9,
    reviewCount: 128,
    packages: buildPackages(899900),
    faq: standardFaq("Banking Platform"),
    reviews: standardReviews,
  },
  {
    slug: "airline-booking-platform",
    name: "Airline Booking Platform",
    category: "platforms",
    tagline: "Search, book, and manage flights with a world-class UX.",
    description:
      "An end-to-end flight booking system — search, seat selection, passenger management, e-tickets, and an admin console — designed to feel like Expedia or Google Flights out of the box.",
    heroImage: "airline",
    screenshots: ["airline-search", "airline-seatmap", "airline-confirmation"],
    features: [
      "Flight search with smart filters",
      "Interactive seat maps",
      "PDF e-tickets & QR boarding passes",
      "Manage-booking self-service",
      "Multi-airline & multi-city support",
      "Admin flight & fare management",
    ],
    benefits: [
      "Launch a travel brand without building booking infra",
      "Mobile-first, conversion-optimized flows",
      "Built-in QR verification for boarding passes",
      "Extensible to hotels and car rentals",
    ],
    startingPriceCents: 749900,
    rating: 4.8,
    reviewCount: 96,
    packages: buildPackages(749900),
    faq: standardFaq("Airline Booking Platform"),
    reviews: standardReviews,
  },
  {
    slug: "logistics-platform",
    name: "Logistics Platform",
    category: "platforms",
    tagline: "Track shipments and optimize fleets in real time.",
    description:
      "A logistics and fleet management platform with live shipment tracking, route optimization, and warehouse tools — everything a modern logistics operator needs in one dashboard.",
    heroImage: "logistics",
    screenshots: ["logistics-tracking", "logistics-fleet", "logistics-warehouse"],
    features: [
      "Real-time shipment tracking",
      "Route optimization engine",
      "Fleet & driver management",
      "Warehouse inventory tools",
      "Customer notification workflows",
      "Analytics & delivery SLAs",
    ],
    benefits: [
      "Cut delivery times with optimized routing",
      "Full visibility from warehouse to doorstep",
      "Scales across regions and fleets",
      "API-first for easy ERP integration",
    ],
    startingPriceCents: 649900,
    rating: 4.7,
    reviewCount: 74,
    packages: buildPackages(649900),
    faq: standardFaq("Logistics Platform"),
    reviews: standardReviews,
  },
  {
    slug: "website-design",
    name: "Website Design",
    category: "design",
    tagline: "Premium, conversion-focused websites crafted end-to-end.",
    description:
      "Bespoke, high-conversion website design and build — from wireframes to a fully responsive, animated, SEO-optimized site ready to launch.",
    heroImage: "website",
    screenshots: ["website-home", "website-mobile", "website-cms"],
    features: [
      "Custom UI/UX design",
      "Fully responsive layouts",
      "CMS integration",
      "SEO & performance optimization",
      "Micro-interactions & animations",
      "Analytics setup",
    ],
    benefits: [
      "Stand out with a premium, custom look",
      "Faster load times and higher conversion",
      "Easy content updates without a developer",
      "Built on modern, maintainable code",
    ],
    startingPriceCents: 149900,
    rating: 4.9,
    reviewCount: 213,
    packages: buildPackages(149900),
    faq: standardFaq("Website Design"),
    reviews: standardReviews,
  },
  {
    slug: "ai-automation",
    name: "AI Automation",
    category: "ai",
    tagline: "Automate workflows with custom AI agents and pipelines.",
    description:
      "Custom AI automation — chatbots, document processing, workflow agents, and integrations that plug directly into your existing tools to save hours every week.",
    heroImage: "ai",
    screenshots: ["ai-agent", "ai-workflow", "ai-analytics"],
    features: [
      "Custom AI agents & chatbots",
      "Document & data extraction pipelines",
      "Workflow automation (Zapier/Make-style)",
      "CRM & tool integrations",
      "Usage analytics & monitoring",
      "Ongoing model tuning",
    ],
    benefits: [
      "Save dozens of hours per week on manual work",
      "Integrates with tools you already use",
      "Built on state-of-the-art LLMs",
      "Transparent, auditable automation logic",
    ],
    startingPriceCents: 199900,
    rating: 4.8,
    reviewCount: 152,
    packages: buildPackages(199900),
    faq: standardFaq("AI Automation"),
    reviews: standardReviews,
  },
  {
    slug: "graphic-design",
    name: "Graphic Design",
    category: "design",
    tagline: "Brand identity, marketing assets, and visual systems.",
    description:
      "Full-spectrum graphic design — logos, brand systems, social kits, and marketing collateral crafted to make your brand feel premium everywhere it shows up.",
    heroImage: "graphic",
    screenshots: ["graphic-brand", "graphic-social", "graphic-print"],
    features: [
      "Logo & brand identity design",
      "Brand guideline systems",
      "Social media asset kits",
      "Marketing & print collateral",
      "Packaging design",
      "Unlimited color/style variations",
    ],
    benefits: [
      "A cohesive brand across every touchpoint",
      "Fast turnaround with senior designers",
      "Source files delivered in every format",
      "Built to scale with your brand",
    ],
    startingPriceCents: 89900,
    rating: 4.9,
    reviewCount: 301,
    packages: buildPackages(89900),
    faq: standardFaq("Graphic Design"),
    reviews: standardReviews,
  },
  {
    slug: "premium-templates",
    name: "Premium Templates",
    category: "templates",
    tagline: "Launch-ready templates for SaaS, portfolios, and stores.",
    description:
      "A library of premium, production-ready templates — SaaS dashboards, portfolios, e-commerce storefronts — built with modern frameworks so you can launch in days.",
    heroImage: "templates",
    screenshots: ["templates-saas", "templates-portfolio", "templates-store"],
    features: [
      "Next.js & React based templates",
      "Fully responsive & accessible",
      "Dark/light mode built in",
      "Component library included",
      "Free lifetime updates",
      "Detailed setup documentation",
    ],
    benefits: [
      "Launch in days instead of months",
      "Production-grade code, not page builders",
      "Regular updates as frameworks evolve",
      "Great starting point for custom builds",
    ],
    startingPriceCents: 4900,
    rating: 4.8,
    reviewCount: 542,
    packages: buildPackages(4900),
    faq: standardFaq("Premium Templates"),
    reviews: standardReviews,
  },
  {
    slug: "custom-software-development",
    name: "Custom Software Development",
    category: "development",
    tagline: "Bespoke software engineering for ambitious products.",
    description:
      "Dedicated engineering for custom products — web apps, internal tools, APIs, and integrations — architected and built by senior engineers from spec to production.",
    heroImage: "custom",
    screenshots: ["custom-planning", "custom-build", "custom-deploy"],
    features: [
      "Discovery & technical architecture",
      "Full-stack web & API development",
      "Cloud infrastructure & DevOps",
      "QA & automated testing",
      "Post-launch support & maintenance",
      "Dedicated engineering pod",
    ],
    benefits: [
      "Senior engineers, not junior contractors",
      "Transparent sprints and weekly demos",
      "Built for maintainability and scale",
      "From spec to production, fully managed",
    ],
    startingPriceCents: 1299900,
    rating: 5.0,
    reviewCount: 61,
    packages: buildPackages(1299900),
    faq: standardFaq("Custom Software Development"),
    reviews: standardReviews,
  },
];

export function getServiceBySlug(slug: string) {
  return services.find((s) => s.slug === slug);
}

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    author: "Maya Chen",
    role: "Founder",
    company: "Northline",
    quote:
      "Nexova shipped our banking platform faster than any agency quote we got — and the polish is genuinely enterprise-grade.",
    rating: 5,
  },
  {
    id: "t2",
    author: "Daniel Osei",
    role: "Head of Product",
    company: "Farewell Logistics",
    quote:
      "We went from spreadsheet chaos to a real-time logistics dashboard in five weeks. Our ops team hasn't looked back.",
    rating: 5,
  },
  {
    id: "t3",
    author: "Priya Nair",
    role: "CTO",
    company: "Fleetwise",
    quote:
      "The AI automation work alone paid for itself in the first month. Support has been fast and genuinely helpful.",
    rating: 5,
  },
  {
    id: "t4",
    author: "Jonah Reyes",
    role: "Marketing Lead",
    company: "Studio Arcadia",
    quote:
      "Our new site converts nearly 3x better than the last one. The animations feel expensive without being slow.",
    rating: 4,
  },
];
