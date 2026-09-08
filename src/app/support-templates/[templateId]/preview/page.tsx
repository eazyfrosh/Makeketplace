"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportSitePreview } from "@/components/support-sites/support-site-preview";
import { createSupportSite, supportTemplates } from "@/lib/support-sites/templates";

export default function TemplatePreviewPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const [mode, setMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const template = supportTemplates.find((item) => item.id === templateId);
  if (!template) return <main className="grid min-h-screen place-items-center">Template not found.</main>;
  const widths = { desktop: "max-w-none", tablet: "max-w-[820px]", mobile: "max-w-[390px]" };
  return <div className="min-h-screen bg-muted/50"><header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4"><div><p className="font-semibold">{template.name}</p><p className="text-xs text-muted-foreground">Interactive preview</p></div><div className="flex gap-1 rounded-xl border p-1">{([['desktop',Monitor],['tablet',Tablet],['mobile',Smartphone]] as const).map(([id,Icon])=><Button key={id} size="icon" variant={mode===id?"default":"ghost"} onClick={()=>setMode(id)} aria-label={`${id} preview`}><Icon className="size-4" /></Button>)}</div><Button asChild><Link href={`/support-templates/${templateId}/editor`}>Customize Template</Link></Button></header><div className={`mx-auto min-h-[calc(100vh-4rem)] bg-background shadow-xl transition-all ${widths[mode]}`}><SupportSitePreview site={createSupportSite(templateId,"preview")} /></div></div>;
}
