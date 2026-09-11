"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SupportSitePreview } from "./support-site-preview";
import { createSupportSite } from "@/lib/support-sites/templates";
import { getSupportSite, getSupportTemplate, saveSupportSite } from "@/lib/support-sites/store";
import { uploadSupportLogo } from "@/lib/support-sites/uploads";
import type { SupportSite } from "@/lib/support-sites/types";

const tabs = ["Branding", "Content", "Sections", "FAQs", "Contact", "SEO"] as const;
type EditorTab = (typeof tabs)[number];

export function SupportEditor({ templateId, siteId }: { templateId: string; siteId?: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [site, setSite] = useState<SupportSite>(() => createSupportSite(templateId, "guest"));
  const [tab, setTab] = useState<EditorTab>("Branding");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace(`/auth/login?next=/support-templates/${templateId}/editor`);
  }, [loading, user, router, templateId]);

  useEffect(() => {
    if (!user) return;
    if (siteId) {
      getSupportSite(siteId).then((found) => {
        if (found && (found.userId === user.uid || user.role === "admin")) setSite(found);
      });
      return;
    }
    getSupportTemplate(templateId).then((template) => {
      setSite(createSupportSite(templateId, user.uid, template ? [template] : undefined));
    });
  }, [user, siteId, templateId]);

  function update(patch: Partial<SupportSite>) {
    setSite((current) => ({ ...current, ...patch }));
    setSaved(false);
    setSaveError("");
  }

  function updateBranding(key: keyof SupportSite["branding"], value: string | number) {
    update({ branding: { ...site.branding, [key]: value } });
  }

  function updateContact(key: keyof SupportSite["contact"], value: string) {
    update({ contact: { ...site.contact, [key]: value } });
  }

  async function save() {
    if (!user || saving) return;
    if (!site.name.trim() || !site.slug.trim()) {
      setSaveError("Add a site name and public slug before saving.");
      return;
    }
    setSaving(true);
    setSaveError("");
    const next = {
      ...site,
      name: site.name.trim(),
      slug: site.slug.trim(),
      userId: siteId ? site.userId : user.uid,
      updatedAt: new Date().toISOString(),
    };
    try {
      await saveSupportSite(next);
      setSite(next);
      setSaved(true);
      router.replace(`/support-templates/${templateId}/editor?site=${next.id}`, { scroll: false });
      toast.success("Support website saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "The project could not be saved. Check your connection and try again.";
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(file: File) {
    if (!user || uploadingLogo) return;
    setUploadingLogo(true);
    setSaveError("");
    try {
      const logoUrl = await uploadSupportLogo(user.uid, site.id, file);
      update({ branding: { ...site.branding, logoUrl } });
      toast.success("Logo uploaded. Save the project to keep it.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "The logo could not be uploaded.";
      setSaveError(message);
      toast.error(message);
    } finally {
      setUploadingLogo(false);
    }
  }

  if (loading || !user) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading editor…</div>;

  return <div className="flex min-h-screen flex-col bg-muted/40">
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3">
      <div><p className="font-semibold">Support Website Studio</p><p className={saveError ? "max-w-xl text-xs text-destructive" : "text-xs text-muted-foreground"}>{saveError || (saved ? "All changes saved" : "Unsaved changes")}</p></div>
      <div className="flex gap-2"><Button type="button" variant="secondary" asChild><a href={`/support-templates/${templateId}/preview${siteId || saved ? `?site=${encodeURIComponent(site.id)}` : ""}`} target="_blank"><Eye className="size-4"/>Preview</a></Button><Button type="button" disabled={saving} onClick={save}>{saving ? <Loader2 className="size-4 animate-spin"/> : <Save className="size-4"/>}{saving ? "Saving…" : "Save project"}</Button></div>
    </header>
    <div className="grid flex-1 lg:grid-cols-[180px_minmax(0,1fr)_330px]">
      <aside className="border-r bg-background p-3">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm ${tab === item ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{item}</button>)}</aside>
      <main className="overflow-auto p-5"><div className="mx-auto min-h-[760px] max-w-5xl overflow-hidden rounded-2xl border bg-background shadow-xl"><SupportSitePreview site={site}/></div></main>
      <aside className="border-l bg-background p-5"><h2 className="mb-5 font-semibold">{tab}</h2><div className="space-y-4"><Properties tab={tab} site={site} update={update} updateBranding={updateBranding} updateContact={updateContact} uploadLogo={uploadLogo} uploadingLogo={uploadingLogo}/></div></aside>
    </div>
  </div>;
}

function Properties({ tab, site, update, updateBranding, updateContact, uploadLogo, uploadingLogo }: { tab: EditorTab; site: SupportSite; update: (patch: Partial<SupportSite>) => void; updateBranding: (key: keyof SupportSite["branding"], value: string | number) => void; updateContact: (key: keyof SupportSite["contact"], value: string) => void; uploadLogo: (file: File) => Promise<void>; uploadingLogo: boolean }) {
  if (tab === "Branding") return <><Field label="Business name" value={site.branding.businessName} onChange={(v) => updateBranding("businessName", v)}/><LogoUpload logoUrl={site.branding.logoUrl} uploading={uploadingLogo} onUpload={uploadLogo} onRemove={() => updateBranding("logoUrl", "")}/><Field label="Primary color" type="color" value={site.branding.primary} onChange={(v) => updateBranding("primary", v)}/><Field label="Background" type="color" value={site.branding.background} onChange={(v) => updateBranding("background", v)}/><Field label="Text color" type="color" value={site.branding.text} onChange={(v) => updateBranding("text", v)}/><Field label="Font" value={site.branding.font} onChange={(v) => updateBranding("font", v)}/><Field label="Border radius" type="number" value={String(site.branding.radius)} onChange={(v) => updateBranding("radius", Number(v))}/></>;
  if (tab === "Content") return <><Field label="Site name" value={site.name} onChange={(v) => update({ name: v })}/><Field label="Public slug" value={site.slug} onChange={(v) => update({ slug: v.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}/><Field label="Hero title" value={site.heroTitle} onChange={(v) => update({ heroTitle: v })}/><Field label="Hero subtitle" value={site.heroSubtitle} onChange={(v) => update({ heroSubtitle: v })}/><Field label="Search placeholder" value={site.searchPlaceholder} onChange={(v) => update({ searchPlaceholder: v })}/></>;
  if (tab === "Sections") return <div className="space-y-2">{site.sections.map((section, index) => <div key={section.id} className="flex items-center gap-2 rounded-xl border p-3"><input type="checkbox" checked={section.enabled} onChange={() => update({ sections: site.sections.map((item) => item.id === section.id ? { ...item, enabled: !item.enabled } : item) })}/><span className="flex-1 capitalize">{section.id}</span><Button size="icon" variant="ghost" disabled={!index} onClick={() => reorder(site, update, index, -1)}><ArrowUp className="size-4"/></Button><Button size="icon" variant="ghost" disabled={index === site.sections.length - 1} onClick={() => reorder(site, update, index, 1)}><ArrowDown className="size-4"/></Button></div>)}</div>;
  if (tab === "FAQs") return <div className="space-y-3">{site.faqs.map((faq) => <div key={faq.id} className="rounded-xl border p-3"><Field label="Question" value={faq.question} onChange={(v) => update({ faqs: site.faqs.map((item) => item.id === faq.id ? { ...item, question: v } : item) })}/><Field label="Answer" value={faq.answer} onChange={(v) => update({ faqs: site.faqs.map((item) => item.id === faq.id ? { ...item, answer: v } : item) })}/><Button variant="ghost" size="sm" onClick={() => update({ faqs: site.faqs.filter((item) => item.id !== faq.id) })}><Trash2 className="size-4"/>Delete</Button></div>)}<Button variant="secondary" onClick={() => update({ faqs: [...site.faqs, { id: `faq-${Date.now()}`, question: "New question", answer: "Add your answer.", category: "General" }] })}><Plus className="size-4"/>Add FAQ</Button></div>;
  if (tab === "Contact") return <><Field label="Support email" value={site.contact.email} onChange={(v) => updateContact("email", v)}/><Field label="Phone" value={site.contact.phone} onChange={(v) => updateContact("phone", v)}/><Field label="WhatsApp URL" value={site.contact.whatsappUrl} onChange={(v) => updateContact("whatsappUrl", v)}/><Field label="Telegram URL" value={site.contact.telegramUrl} onChange={(v) => updateContact("telegramUrl", v)}/><Field label="Live chat URL" value={site.contact.liveChatUrl} onChange={(v) => updateContact("liveChatUrl", v)}/><Field label="Business hours" value={site.contact.businessHours} onChange={(v) => updateContact("businessHours", v)}/></>;
  return <><Field label="Site title" value={site.seo.title} onChange={(v) => update({ seo: { ...site.seo, title: v } })}/><Field label="Meta description" value={site.seo.description} onChange={(v) => update({ seo: { ...site.seo, description: v } })}/><Field label="Keywords" value={site.seo.keywords} onChange={(v) => update({ seo: { ...site.seo, keywords: v } })}/></>;
}

function reorder(site: SupportSite, update: (patch: Partial<SupportSite>) => void, index: number, direction: -1 | 1) { const sections = [...site.sections]; [sections[index], sections[index + direction]] = [sections[index + direction], sections[index]]; update({ sections }); }
function LogoUpload({ logoUrl, uploading, onUpload, onRemove }: { logoUrl: string; uploading: boolean; onUpload: (file: File) => Promise<void>; onRemove: () => void }) { return <div><span className="mb-1.5 block text-sm text-muted-foreground">Business logo</span><div className="rounded-xl border border-dashed p-3">{logoUrl && <div className="mb-3 flex items-center justify-between rounded-lg bg-muted p-2"><img src={logoUrl} alt="Uploaded business logo" className="h-10 max-w-40 object-contain"/><Button type="button" size="icon" variant="ghost" onClick={onRemove} aria-label="Remove logo"><X className="size-4"/></Button></div>}<label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-medium hover:bg-accent">{uploading ? <Loader2 className="size-4 animate-spin"/> : <ImagePlus className="size-4"/>}{uploading ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void onUpload(file); event.currentTarget.value = ""; }}/></label><p className="mt-2 text-xs text-muted-foreground">PNG, JPG or WebP. Maximum 2 MB.</p></div></div>; }
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-sm"><span className="mb-1.5 block text-muted-foreground">{label}</span><Input type={type} value={value} onChange={(event) => onChange(event.target.value)}/></label>; }
