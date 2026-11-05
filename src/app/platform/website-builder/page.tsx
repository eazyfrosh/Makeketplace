"use client";

import * as React from "react";
import { Eye, Loader2, Monitor, Save, Smartphone, Tablet } from "lucide-react";
import { toast } from "sonner";

import { getWebsiteConfig, saveWebsiteConfig } from "@/lib/website/client";
import { getTemplate, templateOptions } from "@/components/website-builder/templates";
import type { WebsiteConfig } from "@/lib/website/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PreviewMode = "desktop" | "tablet" | "mobile";

export default function WebsiteBuilderPage() {
  const [config, setConfig] = React.useState<WebsiteConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState<PreviewMode>("desktop");

  React.useEffect(() => {
    getWebsiteConfig()
      .then((res) => setConfig(res.config))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load your website."))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof WebsiteConfig>(key: K, value: WebsiteConfig[K]) {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!config) return;
    if (!config.siteName.trim()) {
      toast.error("Site name is required.");
      return;
    }
    setSaving(true);
    try {
      const { config: saved } = await saveWebsiteConfig({
        siteName: config.siteName,
        tagline: config.tagline ?? undefined,
        logoUrl: config.logoUrl ?? undefined,
        phone: config.phone ?? undefined,
        address: config.address ?? undefined,
        brandColor: config.brandColor,
        templateId: config.templateId,
      });
      setConfig(saved);
      toast.success("Website saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save your website.");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (loading || !config) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const Template = getTemplate(config.templateId);
  const previewWidth = previewMode === "mobile" ? "w-[390px] max-w-full" : previewMode === "tablet" ? "w-[820px] max-w-full" : "w-full";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Website Design</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Fill in your business details and see your site update live. More template designs are coming soon.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Site details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label htmlFor="site-template">Template</Label>
              <Select value={config.templateId} onValueChange={(v) => update("templateId", v)}>
                <SelectTrigger className="w-full" id="site-template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="site-name">Website name</Label>
              <Input id="site-name" value={config.siteName} onChange={(e) => update("siteName", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="site-tagline">Tagline</Label>
              <Input
                id="site-tagline"
                value={config.tagline ?? ""}
                onChange={(e) => update("tagline", e.target.value)}
                placeholder="A short line about your business"
              />
            </div>
            <div>
              <Label htmlFor="site-logo">Logo URL</Label>
              <Input
                id="site-logo"
                value={config.logoUrl ?? ""}
                onChange={(e) => update("logoUrl", e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Paste a link to your logo image. Direct file upload is coming soon.
              </p>
            </div>
            <div>
              <Label htmlFor="site-phone">Phone number</Label>
              <Input
                id="site-phone"
                value={config.phone ?? ""}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="site-address">Address</Label>
              <Input
                id="site-address"
                value={config.address ?? ""}
                onChange={(e) => update("address", e.target.value)}
                placeholder="123 Main St, Your City"
              />
            </div>
            <div>
              <Label htmlFor="site-color">Brand color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="site-color"
                  type="color"
                  value={config.brandColor}
                  onChange={(e) => update("brandColor", e.target.value)}
                  className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1"
                />
                <Input value={config.brandColor} onChange={(e) => update("brandColor", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="border-border/60 overflow-hidden rounded-2xl border">
          <div className="border-border/60 bg-muted/40 flex flex-wrap items-center gap-1.5 border-b px-3 py-2.5 sm:px-4">
            <span className="size-2.5 rounded-full bg-red-400/70" />
            <span className="size-2.5 rounded-full bg-yellow-400/70" />
            <span className="size-2.5 rounded-full bg-green-400/70" />
            <span className="text-muted-foreground ml-2 text-xs sm:ml-3">Live preview</span>
            <Button type="button" size="sm" variant="secondary" className="ml-auto" onClick={() => { setPreviewMode("desktop"); setPreviewOpen(true); }}><Eye className="size-4" /> <span className="hidden sm:inline">Preview full website</span><span className="sm:hidden">Preview</span></Button>
          </div>
          <div className="group relative max-h-[75vh] overflow-y-auto">
            <Template config={config} />
            <button type="button" onClick={() => { setPreviewMode("desktop"); setPreviewOpen(true); }} className="absolute inset-0 z-10 flex items-center justify-center bg-transparent transition-colors hover:bg-black/5 focus-visible:bg-black/10 focus-visible:outline-none" aria-label="Open full website preview">
              <span className="rounded-full bg-background/95 px-4 py-2 text-sm font-semibold text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">Open full preview</span>
            </button>
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex h-[min(94vh,960px)] max-w-[min(96vw,1440px)] flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b bg-background/95 px-4 py-3 pr-12 backdrop-blur sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><DialogTitle className="truncate text-base sm:text-lg">{config.siteName || "Your website"}</DialogTitle><DialogDescription className="mt-1 truncate">Full website preview — {previewMode} view</DialogDescription></div>
              <div className="flex shrink-0 gap-1 rounded-xl border bg-muted/50 p-1" aria-label="Preview device size">
                {(["desktop", "tablet", "mobile"] as const).map((value) => { const Icon = value === "desktop" ? Monitor : value === "tablet" ? Tablet : Smartphone; return <button key={value} type="button" onClick={() => setPreviewMode(value)} aria-label={`${value} preview`} aria-pressed={previewMode === value} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold capitalize transition-colors sm:px-3 ${previewMode === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Icon className="size-3.5" />{value}</button>; })}
              </div>
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto bg-muted/60 p-2 sm:p-4">
            <div className={`mx-auto min-h-full overflow-hidden rounded-xl bg-background shadow-xl ring-1 ring-black/10 transition-[width] duration-200 ${previewWidth}`}><Template config={config} /></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
