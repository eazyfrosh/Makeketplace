"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Send, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatNaira } from "@/lib/support-sites/templates";
import { deleteSupportSite, getAllSupportSites, getAllSupportTickets, getSupportTemplates, saveSupportSite, saveSupportTemplate } from "@/lib/support-sites/store";
import type { SupportSite, SupportSiteTicket, SupportTemplate, SupportTemplateCategory } from "@/lib/support-sites/types";

const categories: SupportTemplateCategory[] = ["Fintech", "SaaS", "Ecommerce", "Logistics", "Technology", "Corporate", "Dark Mode"];

export default function AdminSupportSitesPage() {
  const { isAdmin, loading } = useRequireAdmin();
  const [sites, setSites] = useState<SupportSite[]>([]);
  const [tickets, setTickets] = useState<SupportSiteTicket[]>([]);
  const [templates, setTemplates] = useState<SupportTemplate[]>([]);
  const [sitesError, setSitesError] = useState("");
  const [editing, setEditing] = useState<SupportTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupportSite | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.allSettled([getAllSupportSites(), getAllSupportTickets(), getSupportTemplates()]).then(([siteResult, ticketResult, templateResult]) => {
      if (siteResult.status === "fulfilled") {
        setSites(siteResult.value);
        setSitesError("");
      } else {
        setSitesError(siteResult.reason instanceof Error ? siteResult.reason.message : "Could not load saved support websites.");
      }
      setTickets(ticketResult.status === "fulfilled" ? ticketResult.value : []);
      setTemplates(templateResult.status === "fulfilled" ? templateResult.value : []);
    });
  }, [isAdmin]);

  async function saveTemplate() {
    if (!editing) return;
    setSaving(true);
    try {
      await saveSupportTemplate(editing);
      setTemplates((items) => items.map((item) => item.id === editing.id ? editing : item));
      setEditing(null); toast.success("Template changes saved");
    } catch { toast.error("Could not save the template"); }
    finally { setSaving(false); }
  }

  async function toggleTemplate(template: SupportTemplate) {
    const next = { ...template, enabled: !template.enabled };
    await saveSupportTemplate(next);
    setTemplates((items) => items.map((item) => item.id === next.id ? next : item));
    toast.success(next.enabled ? "Template published to the marketplace" : "Template hidden from users");
  }

  async function toggleSite(site: SupportSite) {
    const next = { ...site, status: site.status === "published" ? "draft" as const : "published" as const, marketplacePreview: site.status === "published" ? false : site.marketplacePreview };
    await saveSupportSite(next);
    setSites((items) => items.map((item) => item.id === next.id ? next : item));
    toast.success(next.status === "published" ? "Customer website published" : "Customer website returned to draft");
  }

  async function toggleMarketplacePreview(site: SupportSite) {
    const next = { ...site, status: "published" as const, marketplacePreview: !site.marketplacePreview };
    await saveSupportSite(next);
    setSites((items) => items.map((item) => item.id === next.id ? next : item));
    toast.success(next.marketplacePreview ? "This website now appears in the service preview" : "Website removed from the service preview");
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteSupportSite(deleteTarget.id);
      setSites((items) => items.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Saved website deleted");
    } catch {
      toast.error("Could not delete the saved website");
    } finally {
      setDeleting(false);
    }
  }

  if (loading || !isAdmin) return <div className="py-24 text-center text-muted-foreground">Loading admin tools…</div>;
  const users = new Set(sites.map((site) => site.userId)).size;

  return <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Admin workspace</p><h1 className="mt-1 text-3xl font-semibold">Support Websites</h1><p className="mt-2 text-muted-foreground">Edit marketplace templates and control customer publishing.</p></div><Button asChild variant="secondary"><Link href="/support-templates" target="_blank"><Eye className="size-4"/>View marketplace</Link></Button></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[[sites.length,"Sites"],[users,"Users"],[templates.length,"Templates"],[sites.filter(s=>s.status==="published").length,"Published"],[tickets.length,"Tickets"]].map(([number,label])=><div key={String(label)} className="glass rounded-2xl p-5"><div className="text-2xl font-semibold">{number}</div><div className="text-sm text-muted-foreground">{label}</div></div>)}</div>

    <section className="mt-10"><h2 className="text-xl font-semibold">Template catalog</h2><p className="mt-1 text-sm text-muted-foreground">Published templates appear immediately in the customer marketplace.</p><div className="mt-4 grid gap-4 md:grid-cols-2">{templates.map((template)=><article key={template.id} className="rounded-2xl border bg-card p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{template.category}</Badge><Badge variant={template.enabled?"default":"outline"}>{template.enabled?"Published":"Hidden"}</Badge>{template.featured&&<Star className="size-4 fill-amber-400 text-amber-400"/>}</div><h3 className="mt-3 text-lg font-semibold">{template.name}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{template.description}</p></div><span className="shrink-0 font-semibold text-primary">{formatNaira(template.priceCents)}</span></div><div className="mt-5 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={()=>setEditing({...template})}><Pencil className="size-4"/>Edit</Button><Button size="sm" onClick={()=>toggleTemplate(template)}><Send className="size-4"/>{template.enabled?"Unpublish":"Publish to users"}</Button><Button size="sm" variant="ghost" asChild><Link href={`/support-templates/${template.id}/preview`} target="_blank">Preview</Link></Button></div></article>)}</div></section>

    <section className="mt-12"><h2 className="text-xl font-semibold">Customer websites</h2><p className="mt-1 text-sm text-muted-foreground">Review, publish, or choose a saved website as the matching marketplace preview.</p><div className="mt-4 space-y-3">{sites.map((site)=><article key={site.id} className="flex flex-col gap-4 rounded-2xl border p-5 md:flex-row md:items-center"><div className="flex-1"><div className="flex items-center gap-2"><h3 className="font-semibold">{site.name}</h3><Badge variant={site.status==="published"?"default":"outline"}>{site.status}</Badge>{site.marketplacePreview&&<Badge variant="soft">Service preview</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">Owner: {site.userId} · /s/{site.slug}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" asChild><Link href={`/support-templates/${site.templateId}/editor?site=${site.id}`}>Edit site</Link></Button><Button size="sm" variant="ghost" asChild><Link href={`/support-templates/${site.templateId}/preview?site=${site.id}`} target="_blank">Preview saved site</Link></Button><Button size="sm" onClick={()=>toggleSite(site)}>{site.status==="published"?"Unpublish":"Publish website"}</Button><Button size="sm" variant={site.marketplacePreview?"secondary":"default"} onClick={()=>toggleMarketplacePreview(site)}>{site.marketplacePreview?"Remove from service":"Use as service preview"}</Button>{site.status==="published"&&<Button size="sm" variant="ghost" asChild><Link href={`/s/${site.slug}`} target="_blank">Open public site</Link></Button>}<Button size="sm" variant="destructive" onClick={()=>setDeleteTarget(site)}><Trash2 className="size-4"/>Delete</Button></div></article>)}{sitesError&&<div className="rounded-2xl border border-destructive/40 bg-destructive/5 px-5 py-8 text-center text-sm text-destructive">Saved websites could not be loaded: {sitesError}</div>}{!sitesError&&!sites.length&&<div className="rounded-2xl border border-dashed py-12 text-center text-muted-foreground">No customer support websites yet.</div>}</div></section>

    <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open)=>!open&&!deleting&&setDeleteTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete saved website?</AlertDialogTitle><AlertDialogDescription>This permanently removes {deleteTarget?.name ?? "this website"} and disables its published link. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel><AlertDialogAction disabled={deleting} onClick={(event)=>{event.preventDefault();void confirmDelete();}} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleting?"Deleting…":"Delete website"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

    <Dialog open={Boolean(editing)} onOpenChange={(open)=>!open&&setEditing(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Edit support template</DialogTitle><DialogDescription>Changes are saved to Firebase and used by the customer marketplace.</DialogDescription></DialogHeader>{editing&&<div className="grid gap-4 sm:grid-cols-2"><Field label="Template name" value={editing.name} onChange={(value)=>setEditing({...editing,name:value})}/><label className="text-sm"><span className="mb-1.5 block text-muted-foreground">Category</span><select className="h-11 w-full rounded-xl border bg-background px-3" value={editing.category} onChange={(event)=>setEditing({...editing,category:event.target.value as SupportTemplateCategory})}>{categories.map((category)=><option key={category}>{category}</option>)}</select></label><label className="text-sm sm:col-span-2"><span className="mb-1.5 block text-muted-foreground">Description</span><textarea className="min-h-24 w-full rounded-xl border bg-background p-3" value={editing.description} onChange={(event)=>setEditing({...editing,description:event.target.value})}/></label><Field label="Price (₦)" type="number" value={String(editing.priceCents/100)} onChange={(value)=>setEditing({...editing,priceCents:Math.max(0,Number(value)||0)*100})}/><div className="flex items-end gap-5 pb-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(editing.featured)} onChange={(event)=>setEditing({...editing,featured:event.target.checked})}/>Featured</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.enabled} onChange={(event)=>setEditing({...editing,enabled:event.target.checked})}/>Published</label></div><Field label="Primary color" type="color" value={editing.theme.primary} onChange={(value)=>setEditing({...editing,theme:{...editing.theme,primary:value}})}/><Field label="Secondary color" type="color" value={editing.theme.secondary} onChange={(value)=>setEditing({...editing,theme:{...editing.theme,secondary:value}})}/><Field label="Background color" type="color" value={editing.theme.background} onChange={(value)=>setEditing({...editing,theme:{...editing.theme,background:value}})}/><Field label="Text color" type="color" value={editing.theme.text} onChange={(value)=>setEditing({...editing,theme:{...editing.theme,text:value}})}/></div>}<DialogFooter><Button variant="secondary" onClick={()=>setEditing(null)}>Cancel</Button><Button disabled={saving} onClick={saveTemplate}>{saving?"Saving…":"Save changes"}</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}

function Field({label,value,onChange,type="text"}:{label:string;value:string;onChange:(value:string)=>void;type?:string}) { return <label className="text-sm"><span className="mb-1.5 block text-muted-foreground">{label}</span><Input type={type} value={value} onChange={(event)=>onChange(event.target.value)}/></label>; }
