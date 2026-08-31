import type { Service, ServiceCategory, Testimonial } from "@/types";

export const categories: { id: ServiceCategory; label: string }[] = [
  { id: "platforms", label: "Platforms" },
  { id: "design", label: "Design" },
  { id: "ai", label: "Business Tools" },
  { id: "templates", label: "Templates" },
  { id: "development", label: "Development" },
];

const standardFaq = (name: string) => [
  {
    question: `How long does it take to launch a ${name.toLowerCase()}?`,
    answer:
      "Most engagements kick off within 48 hours of purchase. Timeline is scoped during onboarding based on your requirements, typically 1-5 weeks depending on complexity.",
  },
  {
    question: "Do I own the source code?",
    answer:
      "Yes. Every purchase includes full source code ownership and transferable IP once the final invoice is paid in full.",
  },
  {
    question: "What happens after purchase?",
    answer:
      "You'll get access to your Customer Dashboard immediately, a kickoff questionnaire, and a dedicated delivery timeline. Support tickets and updates are tracked in one place.",
  },
  {
    question: "What's included in the price?",
    answer:
      "The full build, source code, and onboarding support described above — one flat price with no hidden add-ons.",
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

export const services: Service[] = [
  {
    slug: "banking-platform",
    accessUrl: "/platform/banking-platform",
    name: "Banking Platform",
    category: "platforms",
    tagline: "Full-stack digital banking, built for scale and compliance.",
    description:
      "A production-grade digital banking platform with accounts, cards, transfers, and compliance tooling baked in — the same foundation neobanks use to launch in weeks, not years.",
    heroImage: "/service-previews/banking-platform.png",
    screenshots: ["/services/banking/overview.png", "/services/banking/transfer.png"],
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
    faq: standardFaq("Banking Platform"),
    reviews: standardReviews,
  },
  {
    slug: "airline-booking-platform",
    accessUrl: "/platform/airline-booking-platform",
    name: "Airline Booking Platform",
    category: "platforms",
    tagline: "Search, book, and manage flights with a world-class UX.",
    description:
      "An end-to-end flight booking system — search, seat selection, passenger management, e-tickets, and an admin console — designed to feel like Expedia or Google Flights out of the box.",
    heroImage: "/service-previews/airline-booking-platform.png",
    screenshots: ["/services/airline/booking-verified.png", "/services/airline/email-confirmation.png"],
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
    faq: standardFaq("Airline Booking Platform"),
    reviews: standardReviews,
  },
  {
    slug: "logistics-platform",
    accessUrl: "/platform/logistics-platform",
    name: "Logistics Platform",
    category: "platforms",
    tagline: "Track shipments and optimize fleets in real time.",
    description:
      "A logistics and fleet management platform with live shipment tracking, route optimization, and warehouse tools — everything a modern logistics operator needs in one dashboard.",
    heroImage: "/service-previews/logistics-platform.png",
    screenshots: ["/services/logistics/track-shipment.png", "/services/logistics/shipment-detail.png"],
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
    faq: standardFaq("Logistics Platform"),
    reviews: standardReviews,
  },
  {
    slug: "website-design",
    accessUrl: "/platform/website-builder",
    name: "Website Design",
    category: "design",
    tagline: "Premium, conversion-focused websites crafted end-to-end.",
    description:
      "Bespoke, high-conversion website design and build — from wireframes to a fully responsive, animated, SEO-optimized site ready to launch.",
    heroImage: "/service-previews/website-design.png",
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
    faq: standardFaq("Website Design"),
    reviews: standardReviews,
  },
  {
    slug: "receipt-generator",
    accessUrl: "/platform/ai-automation",
    name: "Receipt Generator",
    category: "ai",
    tagline: "Create polished, professional receipts in minutes.",
    description:
      "A fast, flexible receipt builder for businesses and freelancers — customize branding, add line items, calculate taxes and discounts, preview on any device, and export client-ready PDFs.",
    heroImage: "/service-previews/receipt-generator.png",
    screenshots: ["/service-previews/receipt-generator.png"],
    features: [
      "Custom business branding",
      "Flexible line items and quantities",
      "Automatic tax and discount totals",
      "Multi-currency receipt support",
      "Responsive mobile preview",
      "One-click PDF export",
    ],
    benefits: [
      "Create professional receipts in minutes",
      "Keep every customer document on-brand",
      "Avoid calculation errors with automatic totals",
      "Download, print, or share receipts instantly",
    ],
    startingPriceCents: 7900,
    rating: 4.9,
    reviewCount: 187,
    faq: standardFaq("Receipt Generator"),
    reviews: standardReviews,
  },
  {
    slug: "graphic-design",
    accessUrl: "/access/graphic-design",
    name: "Edit Image Text",
    category: "design",
    tagline: "Add, replace, or restyle text on any image — fast and on-brand.",
    description:
      "A focused image-text editing service — swap outdated copy, restyle captions, localize on-image text, or add new headlines to existing photos and graphics, matched to your brand's fonts and colors every time.",
    heroImage: "/service-previews/image-text-editing.png",
    screenshots: ["graphic-brand", "graphic-social", "graphic-print"],
    features: [
      "Add or replace text on existing images",
      "Font, color, and style matching to your brand",
      "Multi-language text swaps & localization",
      "Bulk editing for product or social image sets",
      "Text repositioning & resizing for any layout",
      "Fast turnaround, unlimited revision rounds",
    ],
    benefits: [
      "Update creative without a full re-shoot or redesign",
      "Keep every image on-brand across markets and languages",
      "Turn around large image batches quickly",
      "No design software or skills required on your end",
    ],
    startingPriceCents: 89900,
    rating: 4.9,
    reviewCount: 301,
    faq: [
      {
        question: "What kinds of images can you edit text on?",
        answer:
          "Product photos, social posts, ads, banners, screenshots, and marketing graphics — if it has text on it, we can add, replace, or restyle it.",
      },
      {
        question: "Can you match my existing brand fonts and colors?",
        answer:
          "Yes. Send your brand guidelines or a sample image and every edit is matched to your existing style automatically.",
      },
      {
        question: "How fast is turnaround?",
        answer:
          "Most single-image edits are delivered within 24 hours. Bulk batches are scoped and timelined when you submit them.",
      },
      {
        question: "Do I own the edited files?",
        answer:
          "Yes. You receive full-resolution source files with complete usage rights as soon as the order is complete.",
      },
    ],
    reviews: standardReviews,
  },
  {
    slug: "premium-templates",
    accessUrl: "/access/premium-templates",
    name: "Premium Templates",
    category: "templates",
    tagline: "Launch-ready templates for SaaS, portfolios, and stores.",
    description:
      "A library of premium, production-ready templates — SaaS dashboards, portfolios, e-commerce storefronts — built with modern frameworks so you can launch in days.",
    heroImage: "/service-previews/premium-templates.png",
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
    faq: standardFaq("Premium Templates"),
    reviews: standardReviews,
  },
  {
    slug: "custom-software-development",
    accessUrl: "/access/custom-software-development",
    name: "Custom Software Development",
    category: "development",
    tagline: "Bespoke software engineering for ambitious products.",
    description:
      "Dedicated engineering for custom products — web apps, internal tools, APIs, and integrations — architected and built by senior engineers from spec to production.",
    heroImage: "/service-previews/custom-software-development.png",
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
      "The receipt generator cut our admin time immediately. It is polished, fast, and genuinely easy to use.",
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
