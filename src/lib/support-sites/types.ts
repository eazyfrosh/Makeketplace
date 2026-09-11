export type SupportTemplateCategory = "Fintech" | "SaaS" | "Ecommerce" | "Logistics" | "Technology" | "Corporate" | "Dark Mode";

export interface SupportTemplate {
  id: string;
  name: string;
  category: SupportTemplateCategory;
  description: string;
  priceCents: number;
  featured?: boolean;
  enabled: boolean;
  theme: { primary: string; secondary: string; background: string; surface: string; text: string; muted: string; dark: boolean };
}

export interface SupportArticle { id: string; category: string; title: string; slug: string; description: string; content: string }
export interface SupportFaq { id: string; question: string; answer: string; category: string }
export interface SupportContact { email: string; phone: string; whatsappUrl: string; telegramUrl: string; liveChatUrl: string; businessHours: string; enabled: Record<"email" | "phone" | "whatsapp" | "telegram" | "liveChat", boolean> }
export interface SupportBranding { businessName: string; logoUrl: string; faviconUrl: string; heroImageUrl: string; primary: string; secondary: string; background: string; text: string; font: string; radius: number; buttonStyle: "rounded" | "pill" | "square" }
export interface SupportSeo { title: string; description: string; keywords: string; socialImageUrl: string }
export type SupportSectionId = "hero" | "search" | "topics" | "categories" | "faq" | "knowledge" | "announcements" | "contact" | "hours" | "social" | "footer";
export interface SupportSite {
  id: string; userId: string; name: string; slug: string; templateId: string; status: "draft" | "published";
  marketplacePreview?: boolean;
  branding: SupportBranding; contact: SupportContact; seo: SupportSeo; sections: { id: SupportSectionId; enabled: boolean }[];
  heroTitle: string; heroSubtitle: string; searchPlaceholder: string; categories: string[]; articles: SupportArticle[]; faqs: SupportFaq[];
  createdAt: string; updatedAt: string;
}

export interface SupportSiteTicket { id: string; siteId: string; ownerId: string; name: string; email: string; subject: string; category: string; message: string; attachmentUrl?: string; status: "open" | "closed"; createdAt: string }
