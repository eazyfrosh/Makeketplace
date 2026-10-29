import type { MetadataRoute } from "next";

import { services } from "@/lib/data/services";

const siteUrl = "https://www.eazytool.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPages = ["", "/services", "/pricing", "/about", "/contact", "/domains", "/support-templates"];

  return [
    ...publicPages.map((path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...services.filter((service) => !service.comingSoon).map((service) => ({
      url: `${siteUrl}/services/${service.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
