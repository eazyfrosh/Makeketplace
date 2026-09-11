"use client";
import { LicenseGuard } from "@/components/platform/license-guard";
import { PremiumTemplateStudio } from "@/components/premium-sites/premium-template-studio";
export default function PremiumTemplatesPage(){return <LicenseGuard serviceSlug="premium-templates" themeClass=""><PremiumTemplateStudio/></LicenseGuard>}
