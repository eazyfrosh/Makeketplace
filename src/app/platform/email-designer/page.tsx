"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Copy, Loader2, Mail, Monitor, Plus, Save, Send, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useRequireLicense } from "@/hooks/use-require-license";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import type { EmailDesignCategory, ReceiptEmailSend, ReceiptEmailTemplate } from "@/lib/receipt-email/types";
import type { ReceiptTemplateInput } from "@/lib/receipt-email/validation";

const base: ReceiptTemplateInput = {
  name: "New announcement",
  category: "announcement",
  senderName: "Eazy Design Team",
  senderEmail: "hello@example.com",
  brandName: "Eazy Design",
  logoUrl: "",
  subject: "An update from Eazy Design",
  statusLabel: "Announcement",
  heading: "A NEW CHAPTER",
  paragraphs: ["Hello there,", "We have an important update to share with you."],
  backgroundColor: "#050505",
  cardColor: "#050505",
  textColor: "#F8F8F8",
  mutedColor: "#A3A3A3",
  accentColor: "#E76521",
  panelColor: "#713006",
  panelTextColor: "#FFFFFF",
  featuredImageUrl: "",
  panelHeading: "BIG NEWS",
  panelBody: "Discover what is new and what it means for you.",
  buttonEnabled: true,
  buttonText: "Learn more",
  buttonUrl: "https://example.com",
  footer: "Thank you for being part of our community.",
};

const presets: Array<{ label: string; category: EmailDesignCategory; value: ReceiptTemplateInput }> = [
  { label: "Announcement", category: "announcement", value: base },
  { label: "Order update", category: "order-update", value: { ...base, name: "Order update", category: "order-update", subject: "An update about your order", statusLabel: "Order update", heading: "YOUR ORDER UPDATE", paragraphs: ["Hello,", "There is a new update about your order. Review the latest details using the button below."], panelHeading: "ORDER UPDATED", panelBody: "Open your account to view the current order details and next steps.", buttonText: "View order", footer: "Questions? Reply to this email and our support team will help." } },
  { label: "Invitation", category: "invitation", value: { ...base, name: "Event invitation", category: "invitation", subject: "You are invited", statusLabel: "Invitation", heading: "YOU’RE INVITED", paragraphs: ["We would love you to join us.", "Save your place and find all event details below."], panelColor: "#312E81", panelHeading: "JOIN THE EVENT", panelBody: "A memorable experience, created for our community.", buttonText: "Reserve my place", footer: "We hope to see you there." } },
  { label: "Customer support", category: "support", value: { ...base, name: "Support follow-up", category: "support", subject: "An update from customer support", statusLabel: "Support message", heading: "WE’RE HERE TO HELP", paragraphs: ["Hello,", "Our support team has an update regarding your request."], panelColor: "#164E63", panelHeading: "SUPPORT UPDATE", panelBody: "Review the response and contact us if you need more assistance.", buttonText: "View support request", footer: "This message was sent by the customer support team." } },
  { label: "Processing notice", category: "status-notice", value: { ...base, name: "Processing status notice", category: "status-notice", subject: "Customer-created processing status notice", statusLabel: "Status notice", heading: "Status update: processing", paragraphs: ["Note: The user-entered status is currently processing.", "This status has not been independently verified. Check your official account for authoritative information."], buttonEnabled: false, buttonText: "", buttonUrl: "", panelHeading: "PROCESSING TRANSACTION", panelBody: "The user-entered status is currently processing. Verify the details independently in your official account.", footer: "This processing notice records customer-supplied information and is not proof of payment." } },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function sensitive(value: ReceiptTemplateInput) { return value.category === "status-notice" || /payment|transaction|deposit|withdrawal|balance|paid|processing/i.test([value.subject, value.heading, ...value.paragraphs].join(" ")); }

export default function EmailDesignerPage() {
  const { user } = useAuth();
  const { checking, hasAccess } = useRequireLicense("email-designer");
  const [design, setDesign] = React.useState<ReceiptTemplateInput>(base);
  const [designs, setDesigns] = React.useState<ReceiptEmailTemplate[]>([]);
  const [history, setHistory] = React.useState<ReceiptEmailSend[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [previewMode, setPreviewMode] = React.useState<"desktop" | "mobile">("desktop");
  const [recipientEmail, setRecipientEmail] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const headers = await getAuthHeaders();
    const [templatesResponse, historyResponse] = await Promise.all([fetch("/api/email-flash/templates", { headers, cache: "no-store" }), fetch("/api/email-flash/history", { headers, cache: "no-store" })]);
    const [templatesData, historyData] = await Promise.all([templatesResponse.json(), historyResponse.json()]);
    if (!templatesResponse.ok) throw new Error(templatesData.error ?? "Email Designer could not be loaded.");
    setDesigns(templatesData.templates ?? []);
    setHistory(historyData.sends ?? []);
  }, []);

  React.useEffect(() => { if (!hasAccess) return; load().catch((error) => toast.error(error instanceof Error ? error.message : "Email Designer could not be loaded.")).finally(() => setLoading(false)); }, [hasAccess, load]);
  function update<K extends keyof ReceiptTemplateInput>(key: K, value: ReceiptTemplateInput[K]) { setDesign((current) => ({ ...current, [key]: value })); }
  function choosePreset(value: ReceiptTemplateInput) { setSelectedId(null); setDesign({ ...value, paragraphs: [...value.paragraphs] }); }
  function chooseSaved(item: ReceiptEmailTemplate) { const { id: _id, userId: _userId, schemaVersion: _schemaVersion, createdAt: _createdAt, updatedAt: _updatedAt, ...editable } = item; void _id; void _userId; void _schemaVersion; void _createdAt; void _updatedAt; setSelectedId(item.id); setDesign(editable); }

  async function persist(value = design, forceCreate = false) {
    const id = forceCreate ? null : selectedId;
    const headers = await getAuthHeaders();
    const response = await fetch(id ? `/api/email-flash/templates/${id}` : "/api/email-flash/templates", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(value) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Design could not be saved.");
    setSelectedId(data.template.id);
    setDesigns((current) => [data.template, ...current.filter((item) => item.id !== data.template.id)]);
    return data.template.id as string;
  }

  async function save() { setBusy("save"); try { await persist(); toast.success("Email design saved."); } catch (error) { toast.error(error instanceof Error ? error.message : "Design could not be saved."); } finally { setBusy(null); } }
  async function duplicate() { setBusy("duplicate"); try { const value = { ...design, name: `${design.name} copy` }; await persist(value, true); setDesign(value); toast.success("Design duplicated."); } catch (error) { toast.error(error instanceof Error ? error.message : "Design could not be duplicated."); } finally { setBusy(null); } }
  async function remove(id: string) { if (!window.confirm("Delete this saved design?")) return; const headers = await getAuthHeaders(); const response = await fetch(`/api/email-flash/templates/${id}`, { method: "DELETE", headers }); if (!response.ok) return toast.error("Design could not be deleted."); if (selectedId === id) { setSelectedId(null); setDesign(base); } await load(); toast.success("Design deleted."); }

  async function send(mode: "test" | "delivery") {
    setBusy(mode);
    try {
      const templateId = await persist();
      const headers = await getAuthHeaders();
      const response = await fetch("/api/email-flash/send", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ requestId: crypto.randomUUID(), templateId, mode, recipientEmail: mode === "delivery" ? recipientEmail : undefined, recipientConsentConfirmed: mode === "delivery" ? consent : true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Email could not be sent.");
      await load();
      toast.success(mode === "test" ? `Test email sent to ${user?.email ?? "your account"}.` : "Email accepted for delivery.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Email could not be sent."); } finally { setBusy(null); }
  }

  if (checking || (hasAccess && loading)) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (!hasAccess) return null;
  const showWarning = sensitive(design);

  return <main className="min-h-screen bg-slate-100 px-4 py-8 dark:bg-slate-950 sm:px-6"><div className="mx-auto max-w-[1540px]">
    <header className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><Button variant="ghost" size="sm" asChild className="mb-2"><Link href="/dashboard"><ArrowLeft className="size-4" />Dashboard</Link></Button><div className="flex items-center gap-3"><div className="rounded-2xl bg-orange-600 p-3 text-white"><Mail className="size-6" /></div><div><h1 className="text-3xl font-bold">Email Designer</h1><p className="text-muted-foreground">Create polished announcements, updates, invitations, and support emails.</p></div></div></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={duplicate} disabled={Boolean(busy)}><Copy className="size-4" />Duplicate</Button><Button onClick={save} disabled={Boolean(busy)}>{busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save design</Button></div></header>
    <div className="mb-6 flex flex-wrap gap-2">{presets.map((preset) => <Button key={preset.category} size="sm" variant={design.category === preset.category && !selectedId ? "default" : "outline"} onClick={() => choosePreset(preset.value)}>{preset.label}</Button>)}</div>
    <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
      <aside className="space-y-5 rounded-3xl border bg-card p-5 shadow-sm">
        <div><h2 className="font-semibold">Design content</h2><p className="text-sm text-muted-foreground">Every field updates the real email preview.</p></div>
        <Field label="Design name"><Input value={design.name} onChange={(e) => update("name", e.target.value)} /></Field>
        <Field label="Brand name"><Input value={design.brandName} onChange={(e) => update("brandName", e.target.value)} /></Field>
        <Field label="Logo URL"><Input type="url" placeholder="https://.../logo.png" value={design.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} /></Field>
        <Field label="Verified sender name"><Input value={design.senderName} onChange={(e) => update("senderName", e.target.value)} /></Field>
        <Field label="Verified sender email"><Input type="email" value={design.senderEmail} onChange={(e) => update("senderEmail", e.target.value)} /></Field>
        <Field label="Subject line"><Input value={design.subject} onChange={(e) => update("subject", e.target.value)} /></Field>
        <Field label="Top label"><Input value={design.statusLabel} onChange={(e) => update("statusLabel", e.target.value)} /></Field>
        <Field label="Heading"><Input value={design.heading} onChange={(e) => update("heading", e.target.value)} /></Field>
        <div className="space-y-3"><div className="flex items-center justify-between"><Label>Paragraphs</Label><Button size="sm" variant="outline" disabled={design.paragraphs.length >= 8} onClick={() => update("paragraphs", [...design.paragraphs, "New paragraph"])}><Plus className="size-4" />Add</Button></div>{design.paragraphs.map((paragraph, index) => <div key={index} className="flex gap-2"><Textarea value={paragraph} onChange={(e) => update("paragraphs", design.paragraphs.map((value, paragraphIndex) => paragraphIndex === index ? e.target.value : value))} /><Button size="icon" variant="ghost" disabled={design.paragraphs.length === 1} onClick={() => update("paragraphs", design.paragraphs.filter((_, paragraphIndex) => paragraphIndex !== index))}><Trash2 className="size-4" /></Button></div>)}</div>
        <Field label="Featured image URL (optional)"><Input type="url" value={design.featuredImageUrl} onChange={(e) => update("featuredImageUrl", e.target.value)} /></Field>
        <Field label="Panel heading"><Input value={design.panelHeading} onChange={(e) => update("panelHeading", e.target.value)} /></Field>
        <Field label="Panel message"><Textarea value={design.panelBody} onChange={(e) => update("panelBody", e.target.value)} /></Field>
        <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={design.buttonEnabled} onChange={(e) => update("buttonEnabled", e.target.checked)} className="size-4" />Show action button</label>
        {design.buttonEnabled && <><Field label="Button text"><Input value={design.buttonText} onChange={(e) => update("buttonText", e.target.value)} /></Field><Field label="Button URL"><Input type="url" value={design.buttonUrl} onChange={(e) => update("buttonUrl", e.target.value)} /></Field></>}
        <Field label="Footer"><Textarea value={design.footer} onChange={(e) => update("footer", e.target.value)} /></Field>
        <div className="grid grid-cols-3 gap-3">{(["backgroundColor", "cardColor", "textColor", "panelColor", "panelTextColor", "accentColor", "mutedColor"] as const).map((key) => <Field key={key} label={key.replace("Color", "").replace("background", "Canvas").replace("card", "Email").replace("panelText", "Panel text")}><Input type="color" value={design[key]} onChange={(e) => update(key, e.target.value)} /></Field>)}</div>
      </aside>
      <div className="space-y-6">
        <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Live email preview</h2><p className="text-sm text-muted-foreground">This is the layout recipients will receive.</p></div><div className="flex rounded-xl border p-1"><Button size="sm" variant={previewMode === "desktop" ? "default" : "ghost"} onClick={() => setPreviewMode("desktop")}><Monitor className="size-4" /></Button><Button size="sm" variant={previewMode === "mobile" ? "default" : "ghost"} onClick={() => setPreviewMode("mobile")}><Smartphone className="size-4" /></Button></div></div>
          <div className="mx-auto transition-all" style={{ maxWidth: previewMode === "mobile" ? 390 : 620 }}><div className="border" style={{ background: design.cardColor, borderColor: "#272727", color: design.textColor, fontFamily: "Georgia, 'Times New Roman', serif" }}><div className="p-6"><div className="flex items-center gap-5">{design.logoUrl ? <Image src={design.logoUrl} alt="Brand logo" width={50} height={50} unoptimized className="size-[50px] rounded object-contain bg-white" /> : <div className="flex size-[50px] items-center justify-center rounded bg-white text-xl font-black" style={{ color: design.accentColor }}>{design.brandName.slice(0, 1)}</div>}<div className="flex-1 text-2xl font-extrabold">{design.brandName}</div><span className="font-sans text-[11px] uppercase" style={{ color: design.mutedColor }}>{design.statusLabel}</span></div><h2 className="mt-6 text-[22px] font-extrabold leading-tight">{design.heading}</h2><div className="mt-4">{design.paragraphs.map((paragraph, index) => <p key={index} className="mb-4 text-[17px] font-semibold leading-snug">{paragraph}</p>)}</div><div className="mt-7 p-5" style={{ background: design.panelColor, color: design.panelTextColor }}>{design.featuredImageUrl && <Image src={design.featuredImageUrl} alt="Featured" width={900} height={400} unoptimized className="mb-6 max-h-72 w-full object-cover" />}<div className="text-4xl uppercase leading-[.9] sm:text-5xl" style={{ fontFamily: "Impact, 'Arial Black', sans-serif" }}>{design.panelHeading}</div><p className="mt-6 font-sans text-lg leading-relaxed">{design.panelBody}</p>{design.buttonEnabled && design.buttonText && <a href={design.buttonUrl || "#"} onClick={(e) => e.preventDefault()} className="mt-6 inline-block px-5 py-3 font-sans text-sm font-extrabold" style={{ background: design.accentColor, color: design.panelTextColor }}>{design.buttonText}</a>}</div><p className="mt-7 text-[16px] font-bold leading-snug">{design.footer}</p><p className="mt-5 font-sans text-[11px]" style={{ color: design.mutedColor }}>Sent by {design.senderName} &lt;{design.senderEmail}&gt;</p></div>{showWarning && <div className="border-t px-5 py-4 text-center font-sans" style={{ borderColor: "#272727" }}><strong className="text-[11px]">CUSTOMER-CREATED STATUS · UNVERIFIED · NOT PROOF OF PAYMENT</strong><div className="mt-1 text-[10px]" style={{ color: design.mutedColor }}>Verify all financial or account information independently through the named institution.</div></div>}</div></div>
        </section>
        <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-3xl border bg-card p-5"><h2 className="font-semibold">Saved designs</h2><div className="mt-4 space-y-3">{designs.length === 0 ? <p className="text-sm text-muted-foreground">Save your first reusable email design.</p> : designs.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border p-3"><button className="min-w-0 flex-1 text-left" onClick={() => chooseSaved(item)}><div className="truncate font-medium">{item.name}</div><div className="text-xs capitalize text-muted-foreground">{item.category.replace("-", " ")} · {new Date(item.updatedAt).toLocaleDateString()}</div></button><Button size="icon" variant="ghost" onClick={() => remove(item.id)}><Trash2 className="size-4" /></Button></div>)}</div></section>
          <section className="rounded-3xl border bg-card p-5"><h2 className="font-semibold">Send email</h2><p className="mt-1 text-xs text-muted-foreground">The sender domain must be verified. Test emails can only go to your signed-in address.</p><Button className="mt-4 w-full" variant="outline" onClick={() => send("test")} disabled={Boolean(busy)}>{busy === "test" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Send test to {user?.email ?? "my email"}</Button><div className="my-5 border-t" /><Field label="Other recipient"><Input type="email" placeholder="recipient@example.com" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} /></Field><label className="mt-4 flex items-start gap-3 text-xs text-muted-foreground"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4" />I confirm this recipient consented to receive this email from the named sender.</label><Button className="mt-4 w-full" onClick={() => send("delivery")} disabled={Boolean(busy) || !recipientEmail || !consent}>{busy === "delivery" ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}Send email</Button></section></div>
        <section className="rounded-3xl border bg-card p-5"><h2 className="font-semibold">Sent-email history</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-xs uppercase text-muted-foreground"><tr><th className="pb-3">Recipient</th><th className="pb-3">Subject</th><th className="pb-3">Type</th><th className="pb-3">Status</th><th className="pb-3">Date</th></tr></thead><tbody className="divide-y">{history.map((item) => <tr key={item.id}><td className="py-3">{item.recipientEmail}</td><td className="max-w-64 truncate py-3">{item.subject}</td><td className="py-3 capitalize">{item.sendMode}</td><td className="py-3"><Badge variant={["failed", "bounced", "complained", "suppressed"].includes(item.status) ? "destructive" : "secondary"}>{item.status}</Badge></td><td className="py-3">{new Date(item.createdAt).toLocaleString()}</td></tr>)}</tbody></table>{history.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No emails sent yet.</p>}</div></section>
      </div>
    </div>
  </div></main>;
}
