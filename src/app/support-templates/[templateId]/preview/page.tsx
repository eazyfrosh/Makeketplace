"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportSitePreview } from "@/components/support-sites/support-site-preview";
import { createSupportSite, supportTemplates } from "@/lib/support-sites/templates";
import { getPublishedTemplateSite, getSupportSite, getSupportTemplate } from "@/lib/support-sites/store";
import type { SupportSite, SupportTemplate } from "@/lib/support-sites/types";

export default function TemplatePreviewPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const searchParams = useSearchParams();
  const siteId = searchParams.get("site");
  const [mode, setMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [template, setTemplate] = useState<SupportTemplate | undefined>(() => supportTemplates.find((item) => item.id === templateId));
  const [savedSite, setSavedSite] = useState<SupportSite | null>();
  useEffect(() => {
    if (siteId) {
      setSavedSite(undefined);
      getSupportSite(siteId).then(setSavedSite).catch(() => setSavedSite(null));
      return;
    }
    Promise.all([getSupportTemplate(templateId), getPublishedTemplateSite(templateId)]).then(([item, showcase]) => {
      setTemplate(item ?? undefined);
      setSavedSite(showcase);
    });
  }, [siteId, templateId]);
  if (siteId && savedSite === undefined) return <main className="grid min-h-screen place-items-center">Loading saved website…</main>;
  if (siteId && savedSite === null) return <main className="grid min-h-screen place-items-center">Saved website not found or you do not have access.</main>;
  if (!savedSite && !template) return <main className="grid min-h-screen place-items-center">Template not found.</main>;
  const widths = { desktop: "max-w-none", tablet: "max-w-[820px]", mobile: "max-w-[390px]" };
  const previewSite = savedSite ?? createSupportSite(templateId, "preview", template ? [template] : undefined);

  return <div className="min-h-screen bg-muted/50">
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4">
      <div><p className="font-semibold">{siteId ? savedSite?.name : template?.name}</p><p className="text-xs text-muted-foreground">{siteId ? "Saved website preview" : "Interactive template preview"}</p></div>
      <div className="flex gap-1 rounded-xl border p-1">{([['desktop',Monitor],['tablet',Tablet],['mobile',Smartphone]] as const).map(([id,Icon])=><Button key={id} size="icon" variant={mode===id?"default":"ghost"} onClick={()=>setMode(id)} aria-label={`${id} preview`}><Icon className="size-4" /></Button>)}</div>
      <Button asChild><Link href={`/support-templates/${templateId}/editor${siteId && savedSite ? `?site=${encodeURIComponent(savedSite.id)}` : ""}`}>{siteId ? "Edit Website" : "Customize Template"}</Link></Button>
    </header>
    <div className={`mx-auto min-h-[calc(100vh-4rem)] bg-background shadow-xl transition-all ${widths[mode]}`}><SupportSitePreview site={previewSite} /></div>
  </div>;
}
