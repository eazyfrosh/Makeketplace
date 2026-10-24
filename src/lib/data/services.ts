import type { Service, ServiceCategory, Testimonial } from "@/types";

export const categories: { id: ServiceCategory; label: string }[] = [
  { id: "platforms", label: "Platforms" },
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
    question: "What's included with my subscription?",
    answer:
      "The complete service experience described above is included while your EazyTool All Access subscription is active.",
  },
];

const standardReviews = [
  {
    id: "r1",
    author: "Maya Chen",
    role: "Founder",
    rating: 5,
    quote:
      "The delivery was faster than promised and the quality was miles above agencies we'd worked with before.",
  },
  {
    id: "r2",
    author: "Daniel Osei",
    role: "Head of Product",
    rating: 5,
    quote:
      "Clean architecture, great documentation, and a support team that actually responds.",
  },
  {
    id: "r3",
    author: "Priya Nair",
    role: "CTO",
    rating: 4,
    quote:
      "Exactly the premium feel we needed for launch. A couple of rounds of revisions and it was perfect.",
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
    heroImage: "/service-previews/banking-demo-showcase.png",
    screenshots: [
      "/service-previews/banking-demo-showcase.png",
      "/services/banking/overview.png",
      "/services/banking/transfer.png",
    ],
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
    startingPriceCents: 3500000,
    priceUnit: "monthly",
    rating: 4.9,
    reviewCount: 128,
    faq: standardFaq("Banking Platform"),
    reviews: standardReviews,
  },
  {
    slug: "airline-booking-platform",
    accessUrl: "/platform/airline-booking-platform",
    name: "Flight Itinerary Booking",
    category: "platforms",
    tagline: "Search, book, and manage flights with a world-class UX.",
    description:
      "An end-to-end flight booking system — search, seat selection, passenger management, e-tickets, and an admin console — designed to feel like Expedia or Google Flights out of the box.",
    heroImage: "/service-previews/flight-itinerary-showcase.png",
    screenshots: [
      "/service-previews/flight-itinerary-showcase.png",
      "/services/airline/booking-verified.png",
      "/services/airline/email-confirmation.png",
    ],
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
    startingPriceCents: 1000000,
    priceUnit: "per flight",
    rating: 4.8,
    reviewCount: 96,
    faq: standardFaq("Flight Itinerary Booking"),
    reviews: standardReviews,
  },
  {
    slug: "logistics-platform",
    accessUrl: "/platform/logistics-platform",
    name: "Tracking Page",
    category: "platforms",
    tagline: "Track shipments and optimize fleets in real time.",
    description:
      "A logistics and fleet management platform with live shipment tracking, route optimization, and warehouse tools — everything a modern logistics operator needs in one dashboard.",
    heroImage: "/services/logistics/logistics-website-showcase-branded.png",
    screenshots: [
      "/services/logistics/logistics-website-showcase-branded.png",
      "/services/logistics/track-shipment.png",
      "/services/logistics/shipment-detail.png",
    ],
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
    startingPriceCents: 1500000,
    priceUnit: "per shipment",
    rating: 4.7,
    reviewCount: 74,
    faq: standardFaq("Tracking Page"),
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
    heroImage: "/service-previews/receipt-generator-showcase.png",
    screenshots: ["/service-previews/receipt-generator-showcase.png"],
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
    startingPriceCents: 500000,
    priceUnit: "per receipt",
    rating: 4.9,
    reviewCount: 187,
    faq: standardFaq("Receipt Generator"),
    reviews: standardReviews,
  },
  {
    slug: "email-designer",
    accessUrl: "/platform/email-designer",
    name: "Email Flashing",
    category: "ai",
    tagline: "Design and send polished, on-brand emails without touching code.",
    description:
      "Create branded announcements, order updates, invitations, support messages, and clearly labelled status notices with live previews and delivery tracking.",
    heroImage: "/service-previews/email-flashing-showcase.png",
    screenshots: ["/service-previews/email-flashing-showcase.png"],
    features: [
      "Visual branded-email editor",
      "Desktop and mobile live previews",
      "Verified sender-domain protection",
      "Announcement, invitation, order and support templates",
      "Saved templates and send history",
      "Delivery and failure tracking",
    ],
    benefits: [
      "Keep every customer email consistent with your brand",
      "Send safe test emails to your own account",
      "Track delivery without exposing provider secrets",
      "Reuse designs across future customer messages",
    ],
    startingPriceCents: 500000,
    priceUnit: "monthly",
    rating: 4.9,
    reviewCount: 0,
    faq: standardFaq("Email Flashing"),
    reviews: standardReviews,
  },
  {
    slug: "sms-messaging",
    accessUrl: "/sms",
    name: "SMS Flashing",
    category: "platforms",
    tagline: "International SMS messaging is coming soon.",
    description:
      "We are preparing a simple, secure way to send consent-based international text messages and follow their delivery progress.",
    heroImage: "/service-previews/sms-flashing-showcase.png",
    screenshots: ["/service-previews/sms-flashing-showcase.png"],
    features: [
      "Simple international SMS composer",
      "Automatic E.164 phone number formatting",
      "Consent confirmation before every send",
      "Queued and delivery-status tracking",
      "Twilio trial-account support",
      "Secure server-controlled sender",
      "Personal message history",
    ],
    benefits: [
      "Reach opted-in recipients from one clean dashboard",
      "See delivery progress without exposing provider credentials",
      "Upgrade to a Messaging Service later without rebuilding",
      "Keep each user's messages and history isolated",
    ],
    startingPriceCents: 89900,
    comingSoon: true,
    rating: 0,
    reviewCount: 0,
    faq: [
      {
        question: "What is SMS Flashing?",
        answer:
          "SMS Flashing is EazyTools' SMS service for sending individual text messages to recipients who have agreed to receive them.",
      },
      {
        question: "Can I send messages internationally?",
        answer:
          "International sending is planned. The service is not available yet.",
      },
      {
        question: "How do I know whether a message was delivered?",
        answer:
          "Once SMS Flashing launches, message status will be updated when the provider reports delivery or failure.",
      },
      {
        question: "Who can I send messages to?",
        answer:
          "Only send messages to people who have clearly consented. Spam, harassment, impersonation, and unsolicited bulk messaging are prohibited.",
      },
    ],
    reviews: [],
  },
  {
    slug: "premium-templates",
    accessUrl: "https://tesla-blush-nine.vercel.app/api/eazytools/sso",
    name: "Website Builder",
    category: "templates",
    tagline: "Choose a complete website, make it yours, and manage it with confidence.",
    description:
      "Start with a professionally designed website, change the name, logo, colors and content, then manage your own users and website from a private owner dashboard.",
    heroImage: "/service-previews/website-builder-showcase.png",
    screenshots: ["/service-previews/website-builder-showcase.png"],
    features: [
      "ELITE BROKER investment platform template",
      "Hosted Volterra EV marketplace template",
      "NovaBank digital-banking dashboard template",
      "SwiftStream Cargo logistics and freight template",
      "Fully responsive & accessible",
      "Dark/light mode built in",
      "Private owner admin editor",
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
    faq: standardFaq("Website Builder"),
    reviews: standardReviews,
  },
  {
    slug: "qr-code-generator",
    accessUrl: "/platform/qr-code-generator",
    name: "QR Code Generator",
    category: "development",
    tagline: "Create beautiful, scannable QR codes in seconds.",
    description:
      "Generate privacy-friendly QR codes for URLs, text, email, phone calls, SMS, Wi-Fi networks, and digital contact cards, then download them as PNG or SVG.",
    heroImage: "/service-previews/qr-code-showcase.png",
    screenshots: ["/service-previews/qr-code-showcase.png"],
    features: [
      "URL, text, email, phone and SMS QR codes",
      "Wi-Fi network QR codes",
      "Digital contact card QR codes",
      "Custom foreground and background colors",
      "High-resolution PNG downloads",
      "Scalable SVG downloads",
    ],
    benefits: [
      "Generate QR codes instantly without design software",
      "Information stays inside your browser",
      "Ready for print, web, menus and product packaging",
      "Works beautifully on desktop and mobile",
    ],
    startingPriceCents: 0,
    rating: 5.0,
    reviewCount: 61,
    faq: standardFaq("QR Code Generator"),
    reviews: standardReviews,
  },
  {
    slug: "support-website-templates",
    accessUrl: "/support-templates",
    name: "Support Website Templates",
    category: "templates",
    tagline: "Create a polished help center for your business in minutes.",
    description:
      "Choose an original support portal, customize its branding and knowledge base, then publish a customer-ready help center without touching code.",
    heroImage: "/service-previews/support-website-showcase.png",
    screenshots: ["/service-previews/support-website-showcase.png"],
    features: [
      "Eight original responsive designs",
      "Live visual editor",
      "Knowledge base and FAQ tools",
      "Instant support search",
      "Contact and ticket options",
      "Hosted publishing URL",
    ],
    benefits: [
      "Launch a professional help center quickly",
      "Keep every page on-brand",
      "Give customers answers around the clock",
      "No sensitive credentials are ever collected",
    ],
    startingPriceCents: 0,
    rating: 4.9,
    reviewCount: 28,
    faq: standardFaq("Support Website Template"),
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
