"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
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

export default function WebsiteBuilderPage() {
  const [config, setConfig] = React.useState<WebsiteConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

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
          <div className="border-border/60 bg-muted/40 flex items-center gap-1.5 border-b px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-red-400/70" />
            <span className="size-2.5 rounded-full bg-yellow-400/70" />
            <span className="size-2.5 rounded-full bg-green-400/70" />
            <span className="text-muted-foreground ml-3 text-xs">Live preview</span>
          </div>
          <div className="max-h-[75vh] overflow-y-auto">
            <Template config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}
