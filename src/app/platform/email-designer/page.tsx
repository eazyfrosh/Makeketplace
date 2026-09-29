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
import type { EmailDomainRecord, SenderIdentity } from "@/lib/email-domains/types";

const base: ReceiptTemplateInput = {
  name: "New announcement",
  category: "announcement",
  senderName: "Eazy Tool Team",
  senderEmail: "hello@example.com",
  brandName: "Eazy Tool",
  logoUrl: "",
  subject: "An update from Eazy Tool",
  statusLabel: "Status Notice",
  heading: "An important update for you",
  paragraphs: ["Hello there,", "We have an important update to share with you.", "Please review the details below, and contact our team if you have any questions or need additional assistance."],
  backgroundColor: "#050505",
  cardColor: "#050505",
  textColor: "#F8F8F8",
  mutedColor: "#A3A3A3",
  accentColor: "#E76521",
  panelColor: "#713006",
  panelTextColor: "#FFFFFF",
  featuredImageUrl: "",
  panelHeading: "What you need to know",
  panelBody: "Discover what is new, why it matters, and the next steps available to you.",
  warningEnabled: false,
  warningHeading: "Important notice",
  warningMessage: "Please review this information carefully before continuing.",
  buttonEnabled: true,
  buttonText: "Learn more",
  buttonUrl: "https://example.com",
  footer: "Thank you for being part of our community.",
};

const presets: Array<{ label: string; category: EmailDesignCategory; value: ReceiptTemplateInput }> = [
  { label: "Announcement", category: "announcement", value: base },
  { label: "Order update", category: "order-update", value: { ...base, name: "Order update", category: "order-update", subject: "An update about your order", statusLabel: "Order update", heading: "Your order has a new update", paragraphs: ["Hello,", "There is a new update about your order.", "Review the latest details, expected timeline, and any action required using the button below."], panelHeading: "Order details", panelBody: "Open your account to view the current order status, delivery information, and recommended next steps.", warningEnabled: true, warningHeading: "Please check your order details", warningMessage: "Confirm that your delivery address and contact information are correct to avoid delays.", buttonText: "View order", footer: "Questions? Reply to this email and our support team will help." } },
  { label: "Invitation", category: "invitation", value: { ...base, name: "Event invitation", category: "invitation", subject: "You are invited", statusLabel: "Invitation", heading: "You’re invited to join us", paragraphs: ["We would love you to join us.", "Save your place and review the event schedule, location, and attendance details below."], panelColor: "#312E81", panelHeading: "Event details", panelBody: "A memorable experience created for our community, with useful sessions and opportunities to connect.", buttonText: "Reserve my place", footer: "We hope to see you there." } },
  { label: "Customer support", category: "support", value: { ...base, name: "Support follow-up", category: "support", subject: "An update from customer support", statusLabel: "Support message", heading: "We’re here to help", paragraphs: ["Hello,", "Our support team has reviewed your request and prepared an update.", "Read the response below and let us know if you need clarification or additional assistance."], panelColor: "#164E63", panelHeading: "Support update", panelBody: "Review the response, recommended steps, and available contact options for further assistance.", buttonText: "View support request", footer: "This message was sent by the customer support team." } },
  { label: "Processing notice", category: "status-notice", value: { ...base, name: "Processing status notice", category: "status-notice", subject: "Customer-created processing status notice", statusLabel: "Status notice", heading: "Status update: processing", paragraphs: ["The user-entered status is currently marked as processing.", "This status has not been independently verified. Check your official account for authoritative information."], warningEnabled: true, warningHeading: "Verification required", warningMessage: "Do not rely on this message as confirmation. Verify the status independently through the official account or institution.", buttonEnabled: false, buttonText: "", buttonUrl: "", panelHeading: "Processing update", panelBody: "The user-entered status is currently processing. Verify all details independently in your official account.", footer: "This processing notice records customer-supplied information and is not proof of payment." } },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function sensitive(value: ReceiptTemplateInput) { return value.category === "status-notice" || /payment|transaction|deposit|withdrawal|balance|paid|processing/i.test([value.subject, value.heading, ...value.paragraphs].join(" ")); }

export default function EmailDesignerPage() {
  const { user } = useAuth();
  const { checking, hasAccess } = useRequireLicense("email-designer");
  const [design, setDesign] = React.useState<ReceiptTemplateInput>(base);
  const [designs, setDesigns] = React.useState<ReceiptEmailTemplate[]>([]);
  const [history, setHistory] = React.useState<ReceiptEmailSend[]>([]);
  const [emailDomains, setEmailDomains] = React.useState<EmailDomainRecord[]>([]);
  const [senders, setSenders] = React.useState<SenderIdentity[]>([]);
  const [senderIdentityId, setSenderIdentityId] = React.useState("");
  const [newSender, setNewSender] = React.useState({ emailDomainId: "", localPart: "hello", displayName: "", replyTo: user?.email ?? "" });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [previewMode, setPreviewMode] = React.useState<"desktop" | "mobile">("desktop");
  const [mobileWorkspace, setMobileWorkspace] = React.useState<"edit" | "preview" | "send">("edit");
  const [recipientEmail, setRecipientEmail] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const headers = await getAuthHeaders();
    const [templatesResponse, historyResponse, domainsResponse] = await Promise.all([fetch("/api/email-flash/templates", { headers, cache: "no-store" }), fetch("/api/email-flash/history", { headers, cache: "no-store" }), fetch("/api/email-domains", { headers, cache: "no-store" })]);
    const [templatesData, historyData, domainsData] = await Promise.all([templatesResponse.json(), historyResponse.json(), domainsResponse.json()]);
    if (!templatesResponse.ok) throw new Error(templatesData.error ?? "Email Designer could not be loaded.");
    setDesigns(templatesData.templates ?? []);
    setHistory(historyData.sends ?? []);
    setEmailDomains(domainsData.domains ?? []);
    setSenders(domainsData.senders ?? []);
    setSenderIdentityId((current) => current || (domainsData.senders ?? []).find((item: SenderIdentity) => item.isDefault)?.id || domainsData.senders?.[0]?.id || "");
  }, []);

  React.useEffect(() => { if (!hasAccess) return; load().catch((error) => toast.error(error instanceof Error ? error.message : "Email Designer could not be loaded.")).finally(() => setLoading(false)); }, [hasAccess, load]);
  function update<K extends keyof ReceiptTemplateInput>(key: K, value: ReceiptTemplateInput[K]) { setDesign((current) => ({ ...current, [key]: value })); }
  function openMobileWorkspace(workspace: "edit" | "preview" | "send") {
    setMobileWorkspace(workspace);
    if (workspace === "preview") setPreviewMode("mobile");
    window.requestAnimationFrame(() => document.getElementById("email-mobile-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  async function uploadLogo(file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return toast.error("Upload a PNG, JPEG, or WebP logo.");
    if (file.size > 2 * 1024 * 1024) return toast.error("Logo must be 2 MB or smaller.");
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new window.Image();
      image.src = objectUrl;
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Logo could not be read.")); });
      const scale = Math.min(1, 256 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Logo could not be processed.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/webp", 0.84);
      if (dataUrl.length > 450_000) throw new Error("Compressed logo is too large. Choose a simpler image.");
      update("logoUrl", dataUrl);
      toast.success("Logo added to this design. No storage service was used.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Logo could not be processed."); }
    finally { URL.revokeObjectURL(objectUrl); }
  }
  function choosePreset(value: ReceiptTemplateInput) { setSelectedId(null); setDesign({ ...value, paragraphs: [...value.paragraphs] }); }
  function chooseSaved(item: ReceiptEmailTemplate) { const { id: _id, userId: _userId, schemaVersion: _schemaVersion, createdAt: _createdAt, updatedAt: _updatedAt, ...editable } = item; void _id; void _userId; void _schemaVersion; void _createdAt; void _updatedAt; setSelectedId(item.id); setDesign({ ...base, ...editable, paragraphs: [...editable.paragraphs] }); }

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
      const response = await fetch("/api/email-flash/send", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ requestId: crypto.randomUUID(), templateId, senderIdentityId, mode, recipientEmail: mode === "delivery" ? recipientEmail : undefined, recipientConsentConfirmed: mode === "delivery" ? consent : true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Email could not be sent.");
      await load();
      toast.success(mode === "test" ? `Test email sent to ${user?.email ?? "your account"}.` : "Email accepted for delivery.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Email could not be sent."); } finally { setBusy(null); }
  }

  async function createSender() {
    setBusy("sender");
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/email-domains/senders", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ ...newSender, isDefault: senders.length === 0 }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Sender could not be created.");
      await load(); setSenderIdentityId(data.sender.id); toast.success(`${data.sender.address} is ready to use.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Sender could not be created."); } finally { setBusy(null); }
  }

  if (checking || (hasAccess && loading)) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (!hasAccess) return null;
  const showWarning = sensitive(design);

  return <main className="min-h-screen bg-slate-100 px-3 py-5 pb-28 dark:bg-slate-950 sm:px-6 sm:py-8 md:pb-10"><div className="mx-auto min-w-0 max-w-[1540px]">
    <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="min-w-0"><Button variant="ghost" size="sm" asChild className="mb-2 -ml-2"><Link href="/dashboard"><ArrowLeft className="size-4" />Dashboard</Link></Button><div className="flex items-start gap-3"><div className="shrink-0 rounded-xl bg-orange-600 p-2.5 text-white sm:rounded-2xl sm:p-3"><Mail className="size-5 sm:size-6" /></div><div className="min-w-0"><h1 className="text-2xl font-bold sm:text-3xl">Email Designer</h1><p className="text-sm leading-6 text-muted-foreground sm:text-base">Create polished announcements, updates, invitations, and support emails.</p></div></div></div><div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto"><Button className="min-w-0" variant="outline" onClick={duplicate} disabled={Boolean(busy)}><Copy className="size-4 shrink-0" /><span className="truncate">Duplicate</span></Button><Button className="min-w-0" onClick={save} disabled={Boolean(busy)}>{busy === "save" ? <Loader2 className="size-4 shrink-0 animate-spin" /> : <Save className="size-4 shrink-0" />}<span className="truncate">Save design</span></Button></div></header>
    <section className="mb-6 rounded-2xl border bg-card p-4 sm:p-5" aria-label="Email design steps"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">A simple path to send</p><h2 className="mt-1 font-semibold">Create, check, then send</h2></div><div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-4">{[["1", "Choose a template"], ["2", "Write your message"], ["3", "Check the preview"], ["4", "Send when ready"]].map(([step, label]) => <div key={step} className="flex items-center gap-2"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">{step}</span><span>{label}</span></div>)}</div></div></section>
    <div className="sticky top-16 z-30 -mx-3 mb-5 border-y bg-background/95 px-3 py-2 shadow-sm backdrop-blur xl:hidden" aria-label="Email Designer workspace"><div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">{([['edit', 'Edit details'], ['preview', 'Preview'], ['send', 'Send & history']] as const).map(([workspace, label]) => <button key={workspace} type="button" onClick={() => openMobileWorkspace(workspace)} aria-pressed={mobileWorkspace === workspace} className={`min-h-11 rounded-lg px-2 text-xs font-semibold transition-colors ${mobileWorkspace === workspace ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>{label}</button>)}</div></div>
    <div className="scrollbar-none -mx-3 mb-6 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">{presets.map((preset) => <Button key={preset.category} className="shrink-0" size="sm" variant={design.category === preset.category && !selectedId ? "default" : "outline"} onClick={() => choosePreset(preset.value)}>{preset.label}</Button>)}</div>
    <div id="email-mobile-workspace" className="scroll-mt-32 grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
      <aside className={`${mobileWorkspace === "edit" ? "block" : "hidden"} min-w-0 space-y-5 rounded-2xl border bg-card p-4 shadow-sm sm:rounded-3xl sm:p-5 xl:block`}>
        <div><h2 className="font-semibold">1. Write your message</h2><p className="text-sm leading-6 text-muted-foreground">Start with a template, then replace the example text with your own words. Every field updates the real email preview.</p></div>
        <Field label="Design name"><Input value={design.name} onChange={(e) => update("name", e.target.value)} /></Field>
        <Field label="Brand name"><Input value={design.brandName} onChange={(e) => update("brandName", e.target.value)} /></Field>
        <Field label="Upload logo"><div className="space-y-2"><Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => void uploadLogo(e.target.files?.[0])} />{design.logoUrl && <div className="flex items-center justify-between rounded-xl border p-2"><Image src={design.logoUrl} alt="Uploaded logo" width={42} height={42} unoptimized className="size-10 rounded bg-white object-contain" /><Button type="button" size="sm" variant="ghost" onClick={() => update("logoUrl", "")}>Remove</Button></div>}<p className="text-xs text-muted-foreground">PNG, JPEG or WebP up to 2 MB. Compressed and stored inside the design—no external storage.</p></div></Field>
        <Field label="Subject line"><Input value={design.subject} onChange={(e) => update("subject", e.target.value)} /></Field>
        <Field label="Top label"><Input value={design.statusLabel} onChange={(e) => update("statusLabel", e.target.value)} /></Field>
        <Field label="Heading"><Input value={design.heading} onChange={(e) => update("heading", e.target.value)} /></Field>
        <div className="space-y-3"><div className="flex items-center justify-between"><div><Label>Message paragraphs</Label><p className="mt-1 text-xs text-muted-foreground">Add detailed context, instructions, or next steps for the recipient.</p></div><Button size="sm" variant="outline" disabled={design.paragraphs.length >= 8} onClick={() => update("paragraphs", [...design.paragraphs, "Add more helpful details here."])}><Plus className="size-4" />Add</Button></div>{design.paragraphs.map((paragraph, index) => <div key={index} className="flex gap-2"><Textarea rows={4} value={paragraph} onChange={(e) => update("paragraphs", design.paragraphs.map((value, paragraphIndex) => paragraphIndex === index ? e.target.value : value))} /><Button size="icon" variant="ghost" disabled={design.paragraphs.length === 1} onClick={() => update("paragraphs", design.paragraphs.filter((_, paragraphIndex) => paragraphIndex !== index))}><Trash2 className="size-4" /></Button></div>)}</div>
        <div className="space-y-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-950/20"><label className="flex items-center justify-between gap-3 text-sm font-semibold"><span>Warning section</span><input type="checkbox" checked={design.warningEnabled} onChange={(e) => update("warningEnabled", e.target.checked)} className="size-4" /></label><p className="text-xs text-muted-foreground">Add an optional highlighted warning with its own heading and message.</p>{design.warningEnabled && <div className="space-y-3"><Field label="Warning heading"><Input value={design.warningHeading} onChange={(e) => update("warningHeading", e.target.value)} placeholder="Important notice" /></Field><Field label="Warning message"><Textarea rows={4} value={design.warningMessage} onChange={(e) => update("warningMessage", e.target.value)} placeholder="Write the warning details recipients should read carefully." /></Field></div>}</div>
        <Field label="Featured image URL (optional)"><Input type="url" value={design.featuredImageUrl} onChange={(e) => update("featuredImageUrl", e.target.value)} /></Field>
        <Field label="Panel heading"><Input value={design.panelHeading} onChange={(e) => update("panelHeading", e.target.value)} /></Field>
        <Field label="Panel message"><Textarea value={design.panelBody} onChange={(e) => update("panelBody", e.target.value)} /></Field>
        <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={design.buttonEnabled} onChange={(e) => update("buttonEnabled", e.target.checked)} className="size-4" />Show action button</label>
        {design.buttonEnabled && <><Field label="Button text"><Input value={design.buttonText} onChange={(e) => update("buttonText", e.target.value)} /></Field><Field label="Button URL"><Input type="url" value={design.buttonUrl} onChange={(e) => update("buttonUrl", e.target.value)} /></Field></>}
        <Field label="Footer"><Textarea value={design.footer} onChange={(e) => update("footer", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{(["backgroundColor", "cardColor", "textColor", "panelColor", "panelTextColor", "accentColor", "mutedColor"] as const).map((key) => <Field key={key} label={key.replace("Color", "").replace("background", "Canvas").replace("card", "Email").replace("panelText", "Panel text")}><Input type="color" value={design[key]} onChange={(e) => update(key, e.target.value)} /></Field>)}</div>
      </aside>
      <div className="email-designer-workspace space-y-6" data-mobile-workspace={mobileWorkspace}>
        <section className={`${mobileWorkspace === "preview" ? "block" : "hidden"} min-w-0 rounded-2xl border bg-card p-3 shadow-sm sm:rounded-3xl sm:p-6 xl:block`}><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary xl:hidden">Phone preview</p><h2 className="font-semibold">Live email preview</h2><p className="text-sm leading-6 text-muted-foreground">This is the complete email recipients will receive. Scroll down to review every section.</p></div><div className="flex w-full rounded-xl border p-1 sm:w-auto"><Button className="flex-1 sm:flex-none" size="sm" variant={previewMode === "desktop" ? "default" : "ghost"} onClick={() => setPreviewMode("desktop")}><Monitor className="size-4" /><span>Desktop</span></Button><Button className="flex-1 sm:flex-none" size="sm" variant={previewMode === "mobile" ? "default" : "ghost"} onClick={() => setPreviewMode("mobile")}><Smartphone className="size-4" /><span>Mobile</span></Button></div></div>
          <div className="mx-auto w-full min-w-0 transition-all" style={{ maxWidth: previewMode === "mobile" ? 390 : 620 }}><div className="overflow-hidden rounded-xl border" style={{ background: design.cardColor, borderColor: "#272727", color: design.textColor, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif" }}><div className="p-4 sm:p-7"><div className="flex min-w-0 flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4">{design.logoUrl ? <Image src={design.logoUrl} alt="Brand logo" width={50} height={50} unoptimized className="size-11 shrink-0 rounded bg-white object-contain sm:size-[50px]" /> : <div className="flex size-11 shrink-0 items-center justify-center rounded bg-white text-xl font-black sm:size-[50px]" style={{ color: design.accentColor }}>{design.brandName.slice(0, 1)}</div>}<div className="min-w-0 flex-1 break-words text-lg font-bold tracking-tight sm:text-[22px]">{design.brandName}</div><span className="max-w-full break-words text-[9px] font-bold uppercase tracking-wider sm:text-[10px]" style={{ color: design.mutedColor }}>{design.statusLabel}</span></div><h2 className="mt-6 break-words text-[22px] font-bold leading-tight tracking-tight sm:mt-7 sm:text-[26px]">{design.heading}</h2><div className="mt-4">{design.paragraphs.map((paragraph, index) => <p key={index} className="mb-4 break-words text-[15px] font-normal leading-6 sm:text-[16px] sm:leading-7">{paragraph}</p>)}</div>{design.warningEnabled && design.warningHeading && design.warningMessage && <div className="mt-6 rounded-md border-l-4 border-amber-500 bg-amber-50 px-4 py-4 text-amber-950"><div className="break-words text-sm font-bold">{design.warningHeading}</div><p className="mt-1 break-words text-[13px] leading-6">{design.warningMessage}</p></div>}<div className="mt-6 rounded-lg p-4 sm:mt-7 sm:p-6" style={{ background: design.panelColor, color: design.panelTextColor }}>{design.featuredImageUrl && <Image src={design.featuredImageUrl} alt="Featured" width={900} height={400} unoptimized className="mb-6 max-h-72 w-full rounded object-cover" />}<div className="break-words text-2xl font-extrabold leading-tight tracking-tight sm:text-[30px]">{design.panelHeading}</div><p className="mt-4 break-words text-[15px] leading-6 sm:text-[16px] sm:leading-7">{design.panelBody}</p>{design.buttonEnabled && design.buttonText && <a href={design.buttonUrl || "#"} onClick={(e) => e.preventDefault()} className="mt-6 inline-flex max-w-full break-words rounded-lg px-5 py-3 text-center text-sm font-bold" style={{ background: design.accentColor, color: design.panelTextColor }}>{design.buttonText}</a>}</div><p className="mt-7 break-words text-[14px] font-medium leading-6">{design.footer}</p></div>{showWarning && <div className="border-t px-4 py-4 text-center sm:px-5" style={{ borderColor: "#272727" }}><strong className="break-words text-[10px] sm:text-[11px]">CUSTOMER-CREATED STATUS · UNVERIFIED · NOT PROOF OF PAYMENT</strong><div className="mt-1 break-words text-[10px]" style={{ color: design.mutedColor }}>Verify all financial or account information independently through the named institution.</div></div>}</div></div>
        </section>
        <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-3xl border bg-card p-5"><h2 className="font-semibold">Saved designs</h2><div className="mt-4 space-y-3">{designs.length === 0 ? <p className="text-sm text-muted-foreground">Save your first reusable email design.</p> : designs.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border p-3"><button className="min-w-0 flex-1 text-left" onClick={() => chooseSaved(item)}><div className="truncate font-medium">{item.name}</div><div className="text-xs capitalize text-muted-foreground">{item.category.replace("-", " ")} · {new Date(item.updatedAt).toLocaleDateString()}</div></button><Button size="icon" variant="ghost" onClick={() => remove(item.id)}><Trash2 className="size-4" /></Button></div>)}</div></section>
          <section className="rounded-3xl border bg-card p-5"><h2 className="font-semibold">4. Send when ready</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Use a test email first. To send to a recipient, you need a verified sender and their consent.</p>{senders.length ? <div className="mt-4 space-y-3"><Field label="Verified sender"><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={senderIdentityId} onChange={(event) => setSenderIdentityId(event.target.value)}>{senders.map((sender) => <option key={sender.id} value={sender.id}>{sender.displayName} &lt;{sender.address}&gt;</option>)}</select></Field>{(() => { const selected = senders.find((sender) => sender.id === senderIdentityId); return selected ? <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground"><div><strong className="text-foreground">Sender name:</strong> {selected.displayName}</div><div className="mt-1"><strong className="text-foreground">Reply-to:</strong> {selected.replyTo}</div><div className="mt-1">Replies go to the reply-to address; this is an outbound identity, not an inbox.</div></div> : null; })()}</div> : <div className="mt-4 rounded-xl border border-dashed p-4 text-sm"><p className="font-medium">No verified sender yet</p><p className="mt-1 text-xs text-muted-foreground">A purchased domain must finish automatic email verification first.</p>{emailDomains.filter((domain) => domain.status === "ready" && !domain.suspended).length > 0 && <div className="mt-4 space-y-3"><Field label="Verified domain"><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={newSender.emailDomainId} onChange={(event) => setNewSender((current) => ({ ...current, emailDomainId: event.target.value }))}><option value="">Select domain</option>{emailDomains.filter((domain) => domain.status === "ready" && !domain.suspended).map((domain) => <option key={domain.id} value={domain.id}>{domain.domain}</option>)}</select></Field><Field label="Address name"><Input value={newSender.localPart} onChange={(event) => setNewSender((current) => ({ ...current, localPart: event.target.value }))} placeholder="hello" /></Field><Field label="Sender display name"><Input value={newSender.displayName} onChange={(event) => setNewSender((current) => ({ ...current, displayName: event.target.value }))} /></Field><Field label="Reply-to address"><Input type="email" value={newSender.replyTo} onChange={(event) => setNewSender((current) => ({ ...current, replyTo: event.target.value }))} /></Field><Button type="button" variant="secondary" onClick={createSender} disabled={busy === "sender" || !newSender.emailDomainId || !newSender.displayName || !newSender.replyTo}>{busy === "sender" && <Loader2 className="size-4 animate-spin" />}Create sender</Button></div>}</div>}<Button className="mt-4 w-full" variant="outline" onClick={() => send("test")} disabled={Boolean(busy) || !senderIdentityId}>{busy === "test" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Send test to {user?.email ?? "my email"}</Button><div className="my-5 border-t" /><Field label="Recipient email"><Input type="email" placeholder="recipient@example.com" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} /></Field><label className="mt-4 flex items-start gap-3 text-xs text-muted-foreground"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4" />I confirm this recipient consented to receive this email from the named sender.</label><Button className="mt-4 w-full" onClick={() => send("delivery")} disabled={Boolean(busy) || !senderIdentityId || !recipientEmail || !consent}>{busy === "delivery" ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}Send email</Button></section></div>
        <section className="rounded-3xl border bg-card p-5"><h2 className="font-semibold">Sent-email history</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-xs uppercase text-muted-foreground"><tr><th className="pb-3">Recipient</th><th className="pb-3">Subject</th><th className="pb-3">Type</th><th className="pb-3">Status</th><th className="pb-3">Date</th></tr></thead><tbody className="divide-y">{history.map((item) => <tr key={item.id}><td className="py-3">{item.recipientEmail}</td><td className="max-w-64 truncate py-3">{item.subject}</td><td className="py-3 capitalize">{item.sendMode}</td><td className="py-3"><Badge variant={["failed", "bounced", "complained", "suppressed"].includes(item.status) ? "destructive" : "secondary"}>{item.status}</Badge></td><td className="py-3">{new Date(item.createdAt).toLocaleString()}</td></tr>)}</tbody></table>{history.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No emails sent yet.</p>}</div></section>
      </div>
    </div>
  </div></main>;
}
