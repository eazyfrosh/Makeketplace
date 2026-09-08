import type { Metadata } from "next";
import { SupportTemplateMarketplace } from "@/components/support-sites/template-marketplace";
export const metadata: Metadata = { title: "Support Website Templates", description: "Original, professional help-center and knowledge-base templates for your business." };
export default function SupportTemplatesPage() { return <SupportTemplateMarketplace />; }
