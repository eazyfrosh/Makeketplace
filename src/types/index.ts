export type ServiceCategory =
  | "platforms"
  | "design"
  | "ai"
  | "templates"
  | "development";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Review {
  id: string;
  author: string;
  role: string;
  rating: number;
  quote: string;
}

export interface Service {
  slug: string;
  name: string;
  category: ServiceCategory;
  tagline: string;
  description: string;
  heroImage: string;
  screenshots: string[];
  features: string[];
  benefits: string[];
  startingPriceCents: number;
  rating: number;
  reviewCount: number;
  faq: FaqItem[];
  reviews: Review[];
  accessUrl: string;
  downloadUrl?: string;
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
}

export interface CartItem {
  serviceSlug: string;
  serviceName: string;
  packageId: string;
  packageName: string;
  priceCents: number;
  billing: "one-time" | "monthly";
}

export type PaymentProvider = "stripe" | "paystack" | "flutterwave" | "admin_grant";

export interface Order {
  id: string;
  userId: string | null;
  email: string;
  items: CartItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  couponCode: string | null;
  provider: PaymentProvider;
  paymentReference: string;
  status: "paid" | "pending" | "failed";
  licenseIds: string[];
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: "open" | "pending" | "resolved";
  createdAt: string;
}
