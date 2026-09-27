"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Loader2, Mail, Monitor, Plus, Save, Send, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRequireLicense } from "@/hooks/use-require-license";
import { getAuthHeaders } from "@/lib/licensing/client-auth";
import type { ReceiptEmailSend, ReceiptEmailTemplate, ReceiptTransactionOption } from "@/lib/receipt-email/types";
import type { ReceiptTemplateInput } from "@/lib/receipt-email/validation";

const initialTemplate: ReceiptTemplateInput = {
  name: "Modern receipt",
  senderName: "EazyTools Receipts",
  senderEmail: "receipts@example.com",
  logoUrl: "",
  primaryColor: "#2563EB",
  backgroundColor: "#F1F5F9",
  textColor: "#0F172A",
  merchantName: "Your Business",
  merchantEmail: "hello@example.com",
  merchantPhone: "",
  merchantAddress: "Lagos, Nigeria",
  subject: "Receipt {{reference}} from Your Business",
  message: "Thank you for your purchase. Here are the details of your completed transaction.",
  footer: "Keep this email for your records.",
  sampleCustomerName: "Ada Customer",
  sampleItems: [{ description: "Professional service", quantity: 1, unitAmountMinor: 2500000 }],
  currency: "NGN",
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(value / 100);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

export default function EmailFlashPage() {
  const { checking, hasAccess } = useRequireLicense("email-flash");
  const [template, setTemplate] = React.useState<ReceiptTemplateInput>(initialTemplate);
  const [templates, setTemplates] = React.useState<ReceiptEmailTemplate[]>([]);
  const [transactions, setTransactions] = React.useState<ReceiptTransactionOption[]>([]);
  const [history, setHistory] = React.useState<ReceiptEmailSend[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<"desktop" | "mobile">("desktop");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [recipientEmail, setRecipientEmail] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [transactionId, setTransactionId] = React.useState("");

  const load = React.useCallback(async () => {
    const headers = await getAuthHeaders();
    const [templateResponse, transactionResponse, historyResponse] = await Promise.all([
      fetch("/api/email-flash/templates", { headers, cache: "no-store" }),
      fetch("/api/email-flash/transactions", { headers, cache: "no-store" }),
      fetch("/api/email-flash/history", { headers, cache: "no-store" }),
    ]);
    const [templateData, transactionData, historyData] = await Promise.all([templateResponse.json(), transactionResponse.json(), historyResponse.json()]);
    if (!templateResponse.ok) throw new Error(templateData.error ?? "Email Flash could not be loaded.");
    setTemplates(templateData.templates ?? []);
    setTransactions(transactionData.transactions ?? []);
    setHistory(historyData.sends ?? []);
  }, []);

  React.useEffect(() => {
    if (!hasAccess) return;
    load().catch((error) => toast.error(error instanceof Error ? error.message : "Email Flash could not be loaded.")).finally(() => setLoading(false));
  }, [hasAccess, load]);

  function update<K extends keyof ReceiptTemplateInput>(key: K, value: ReceiptTemplateInput[K]) {
    setTemplate((current) => ({ ...current, [key]: value }));
  }

  function selectTemplate(item: ReceiptEmailTemplate) {
    const { id: _id, userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, ...editable } = item;
    void _id; void _userId; void _createdAt; void _updatedAt;
    setTemplate(editable);
    setSelectedId(item.id);
  }

  async function saveTemplate() {
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(selectedId ? `/api/email-flash/templates/${selectedId}` : "/api/email-flash/templates", {
        method: selectedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(template),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Template could not be saved.");
      setSelectedId(data.template.id);
      await load();
      toast.success("Email template saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Template could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(id: string) {
    if (!window.confirm("Delete this saved Email Flash template?")) return;
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/email-flash/templates/${id}`, { method: "DELETE", headers });
    const data = await response.json();
    if (!response.ok) return toast.error(data.error ?? "Template could not be deleted.");
    if (selectedId === id) { setSelectedId(null); setTemplate(initialTemplate); }
    await load();
    toast.success("Template deleted.");
  }

  async function sendReceipt() {
    if (!selectedId) return toast.error("Save the template before sending.");
    if (!transactionId) return toast.error("Choose a completed EazyTools transaction.");
    setSending(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/email-flash/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ requestId: crypto.randomUUID(), templateId: selectedId, transactionId, recipientEmail, customerName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Email could not be sent.");
      await load();
      toast.success("Receipt email accepted for delivery.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Email could not be sent.");
    } finally {
      setSending(false);
    }
  }

  if (checking || (hasAccess && loading)) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (!hasAccess) return null;

  const total = template.sampleItems.reduce((sum, item) => sum + item.quantity * item.unitAmountMinor, 0);
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10 dark:from-slate-950 dark:to-background sm:px-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2"><Link href="/dashboard"><ArrowLeft className="size-4" />Dashboard</Link></Button>
            <div className="flex items-center gap-3"><div className="rounded-2xl bg-blue-600 p-3 text-white"><Mail className="size-6" /></div><div><h1 className="text-3xl font-bold tracking-tight">Email Flash</h1><p className="text-muted-foreground">Build, preview, and send genuine branded transaction receipts.</p></div></div>
          </div>
          <Button onClick={saveTemplate} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{selectedId ? "Update template" : "Save template"}</Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <section className="space-y-6 rounded-3xl border bg-card p-5 shadow-sm">
            <div><h2 className="font-semibold">Brand and content</h2><p className="text-sm text-muted-foreground">Changes appear instantly in the preview.</p></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Template name"><Input value={template.name} onChange={(e) => update("name", e.target.value)} /></Field>
              <Field label="Logo URL"><Input type="url" placeholder="https://your-domain.com/logo.png" value={template.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} /></Field>
              <Field label="Merchant name"><Input value={template.merchantName} onChange={(e) => update("merchantName", e.target.value)} /></Field>
              <Field label="Merchant email"><Input type="email" value={template.merchantEmail} onChange={(e) => update("merchantEmail", e.target.value)} /></Field>
              <Field label="Merchant phone"><Input value={template.merchantPhone} onChange={(e) => update("merchantPhone", e.target.value)} /></Field>
              <Field label="Merchant address"><Textarea value={template.merchantAddress} onChange={(e) => update("merchantAddress", e.target.value)} /></Field>
              <Field label="Sender name"><Input value={template.senderName} onChange={(e) => update("senderName", e.target.value)} /></Field>
              <Field label="Verified sender email"><Input type="email" value={template.senderEmail} onChange={(e) => update("senderEmail", e.target.value)} /></Field>
              <Field label="Email subject"><Input value={template.subject} onChange={(e) => update("subject", e.target.value)} /></Field>
              <Field label="Custom message"><Textarea value={template.message} onChange={(e) => update("message", e.target.value)} /></Field>
              <Field label="Footer"><Textarea value={template.footer} onChange={(e) => update("footer", e.target.value)} /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Primary"><Input type="color" value={template.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} /></Field>
                <Field label="Background"><Input type="color" value={template.backgroundColor} onChange={(e) => update("backgroundColor", e.target.value)} /></Field>
                <Field label="Text"><Input type="color" value={template.textColor} onChange={(e) => update("textColor", e.target.value)} /></Field>
              </div>
            </div>
            <div className="space-y-3 border-t pt-5">
              <div className="flex items-center justify-between"><h3 className="font-medium">Preview line items</h3><Button size="sm" variant="outline" onClick={() => update("sampleItems", [...template.sampleItems, { description: "New item", quantity: 1, unitAmountMinor: 0 }])}><Plus className="size-4" />Item</Button></div>
              {template.sampleItems.map((item, index) => <div key={index} className="grid grid-cols-[1fr_70px_100px_36px] gap-2"><Input aria-label="Item description" value={item.description} onChange={(e) => update("sampleItems", template.sampleItems.map((value, itemIndex) => itemIndex === index ? { ...value, description: e.target.value } : value))} /><Input aria-label="Quantity" type="number" min="1" value={item.quantity} onChange={(e) => update("sampleItems", template.sampleItems.map((value, itemIndex) => itemIndex === index ? { ...value, quantity: Number(e.target.value) } : value))} /><Input aria-label="Amount in naira" type="number" min="0" value={item.unitAmountMinor / 100} onChange={(e) => update("sampleItems", template.sampleItems.map((value, itemIndex) => itemIndex === index ? { ...value, unitAmountMinor: Math.round(Number(e.target.value) * 100) } : value))} /><Button aria-label="Remove item" size="icon" variant="ghost" disabled={template.sampleItems.length === 1} onClick={() => update("sampleItems", template.sampleItems.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></Button></div>)}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Live preview</h2><p className="text-sm text-muted-foreground">Sample details are only used for preview.</p></div><div className="flex rounded-xl border p-1"><Button size="sm" variant={preview === "desktop" ? "default" : "ghost"} onClick={() => setPreview("desktop")}><Monitor className="size-4" /></Button><Button size="sm" variant={preview === "mobile" ? "default" : "ghost"} onClick={() => setPreview("mobile")}><Smartphone className="size-4" /></Button></div></div>
              <div className="mx-auto overflow-hidden rounded-[28px] border shadow-xl transition-all" style={{ maxWidth: preview === "mobile" ? 390 : 760, backgroundColor: template.backgroundColor }}>
                <div className="p-4 sm:p-8"><div className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="h-2" style={{ backgroundColor: template.primaryColor }} /><div className="p-6 sm:p-9" style={{ color: template.textColor }}>{template.logoUrl ? <Image src={template.logoUrl} alt="Merchant logo" width={192} height={56} unoptimized className="max-h-14 max-w-48 object-contain" /> : <div className="text-xl font-extrabold" style={{ color: template.primaryColor }}>{template.merchantName}</div>}<h2 className="mt-7 text-3xl font-bold">Receipt</h2><p className="mt-2 text-sm text-slate-500">Hello {template.sampleCustomerName}, {template.message}</p><div className="mt-6 rounded-xl bg-slate-50 p-4"><div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Verified EazyTools transaction</div><div className="mt-1 font-mono font-bold">EZT-PREVIEW-001</div></div><div className="mt-5 divide-y">{template.sampleItems.map((item, index) => <div key={index} className="flex justify-between gap-4 py-3 text-sm"><span>{item.description} × {item.quantity}</span><strong>{money(item.unitAmountMinor * item.quantity, template.currency)}</strong></div>)}</div><div className="mt-5 flex items-end justify-between border-t pt-5"><strong>Total</strong><strong className="text-2xl" style={{ color: template.primaryColor }}>{money(total, template.currency)}</strong></div><div className="mt-7 border-t pt-5 text-xs leading-6 text-slate-500"><strong style={{ color: template.textColor }}>{template.merchantName}</strong><br />{template.merchantAddress}<br />{template.merchantEmail}{template.merchantPhone ? ` · ${template.merchantPhone}` : ""}</div><p className="mt-5 text-xs text-slate-400">{template.footer}</p></div></div></div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border bg-card p-5"><h2 className="font-semibold">Saved templates</h2><div className="mt-4 space-y-3">{templates.length === 0 ? <p className="text-sm text-muted-foreground">Save your first reusable design.</p> : templates.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><button className="min-w-0 flex-1 text-left" onClick={() => selectTemplate(item)}><div className="truncate font-medium">{item.name}</div><div className="text-xs text-muted-foreground">Updated {new Date(item.updatedAt).toLocaleDateString()}</div></button><Button size="icon" variant="ghost" onClick={() => deleteTemplate(item.id)}><Trash2 className="size-4" /></Button></div>)}</div></div>
              <div className="rounded-3xl border bg-card p-5"><h2 className="font-semibold">Send genuine receipt</h2><p className="mt-1 text-xs text-muted-foreground">A verified sender domain is required. Amounts and references come from EazyTools, not this form.</p><div className="mt-4 space-y-3"><Input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /><Input type="email" placeholder="Customer email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} /><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={transactionId} onChange={(e) => setTransactionId(e.target.value)}><option value="">Select completed transaction</option>{transactions.map((item) => <option key={item.id} value={item.id}>{item.reference} · {money(item.amountMinor, item.currency)}</option>)}</select>{transactions.length === 0 && <p className="text-xs text-amber-600">No completed EazyTools transactions are available for receipt sending.</p>}<Button className="w-full" onClick={sendReceipt} disabled={sending || !transactions.length}>{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Send receipt email</Button></div></div>
            </section>

            <section className="rounded-3xl border bg-card p-5"><h2 className="font-semibold">Delivery history</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="text-xs uppercase text-muted-foreground"><tr><th className="pb-3">Recipient</th><th className="pb-3">Reference</th><th className="pb-3">Amount</th><th className="pb-3">Status</th><th className="pb-3">Date</th></tr></thead><tbody className="divide-y">{history.map((item) => <tr key={item.id}><td className="py-3">{item.recipientEmail}</td><td className="py-3 font-mono text-xs">{item.transactionReference}</td><td className="py-3">{money(item.amountMinor, item.currency)}</td><td className="py-3"><Badge variant={item.status === "failed" || item.status === "bounced" ? "destructive" : "secondary"}>{item.status === "delivered" && <CheckCircle2 className="mr-1 size-3" />}{item.status}</Badge></td><td className="py-3">{new Date(item.createdAt).toLocaleString()}</td></tr>)}</tbody></table>{history.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No receipt emails sent yet.</p>}</div></section>
          </div>
        </div>
      </div>
    </main>
  );
}
