/**
 * templateId selects which component in the template registry
 * (src/components/website-builder/templates/index.ts) renders this config.
 * Only "default" exists today — more designed templates can be added to the
 * registry later without any change to this data model.
 */
export interface WebsiteConfig {
  userId: string;
  templateId: string;
  siteName: string;
  tagline: string | null;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  brandColor: string;
  createdAt: string;
  updatedAt: string;
}
