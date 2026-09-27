"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  AtSign,
  Check,
  Copy,
  Download,
  FileText,
  Link2,
  Mail,
  MessageSquare,
  Phone,
  QrCode,
  RefreshCcw,
  Smartphone,
  UserRound,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildQrPayload,
  defaultQrFields,
  type QrFields,
  type QrMode,
} from "@/lib/qr/payload";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "url", label: "URL", icon: Link2, hint: "Open any web page" },
  { id: "text", label: "Text", icon: FileText, hint: "Show a message" },
  { id: "email", label: "Email", icon: Mail, hint: "Compose an email" },
  { id: "phone", label: "Phone", icon: Phone, hint: "Start a call" },
  { id: "sms", label: "SMS", icon: MessageSquare, hint: "Send a text" },
  { id: "wifi", label: "Wi-Fi", icon: Wifi, hint: "Join a network" },
  { id: "contact", label: "Contact", icon: UserRound, hint: "Save a contact" },
] as const;

const fieldClass = "space-y-2";

function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className={fieldClass}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function EditorFields({
  mode,
  fields,
  update,
}: {
  mode: QrMode;
  fields: QrFields;
  update: <K extends keyof QrFields>(key: K, value: QrFields[K]) => void;
}) {
  if (mode === "url")
    return (
      <FormField
        label="Website URL"
        hint="https:// will be added automatically when omitted."
      >
        <Input
          type="url"
          inputMode="url"
          value={fields.url}
          onChange={(event) => update("url", event.target.value)}
          placeholder="https://example.com"
        />
      </FormField>
    );
  if (mode === "text")
    return (
      <FormField label="Text or message">
        <Textarea
          maxLength={2000}
          value={fields.text}
          onChange={(event) => update("text", event.target.value)}
          placeholder="Type the text people should see after scanning"
          className="min-h-36"
        />
      </FormField>
    );
  if (mode === "email")
    return (
      <div className="space-y-5">
        <FormField label="Email address">
          <Input
            type="email"
            value={fields.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="hello@example.com"
          />
        </FormField>
        <FormField label="Subject (optional)">
          <Input
            value={fields.subject}
            onChange={(event) => update("subject", event.target.value)}
            maxLength={200}
          />
        </FormField>
        <FormField label="Message (optional)">
          <Textarea
            value={fields.body}
            onChange={(event) => update("body", event.target.value)}
            maxLength={1200}
          />
        </FormField>
      </div>
    );
  if (mode === "phone")
    return (
      <FormField
        label="Phone number"
        hint="Include the international country code where possible."
      >
        <Input
          type="tel"
          inputMode="tel"
          value={fields.phone}
          onChange={(event) => update("phone", event.target.value)}
          placeholder="+234 800 000 0000"
        />
      </FormField>
    );
  if (mode === "sms")
    return (
      <div className="space-y-5">
        <FormField label="Phone number">
          <Input
            type="tel"
            inputMode="tel"
            value={fields.smsPhone}
            onChange={(event) => update("smsPhone", event.target.value)}
            placeholder="+234 800 000 0000"
          />
        </FormField>
        <FormField label="Pre-filled SMS message">
          <Textarea
            value={fields.smsMessage}
            onChange={(event) => update("smsMessage", event.target.value)}
            maxLength={500}
          />
        </FormField>
      </div>
    );
  if (mode === "wifi")
    return (
      <div className="space-y-5">
        <FormField label="Network name (SSID)">
          <Input
            value={fields.wifiName}
            onChange={(event) => update("wifiName", event.target.value)}
            maxLength={128}
          />
        </FormField>
        <FormField label="Security">
          <Select
            value={fields.wifiSecurity}
            onValueChange={(value) =>
              update("wifiSecurity", value as QrFields["wifiSecurity"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WPA">WPA / WPA2 / WPA3</SelectItem>
              <SelectItem value="WEP">WEP</SelectItem>
              <SelectItem value="nopass">No password</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        {fields.wifiSecurity !== "nopass" && (
          <FormField label="Wi-Fi password">
            <Input
              type="password"
              value={fields.wifiPassword}
              onChange={(event) => update("wifiPassword", event.target.value)}
              maxLength={128}
              autoComplete="new-password"
            />
          </FormField>
        )}
        <label className="flex cursor-pointer items-center justify-between rounded-xl border p-4 text-sm">
          <span>
            <strong className="block">Hidden network</strong>
            <span className="text-muted-foreground">
              The network does not broadcast its name.
            </span>
          </span>
          <input
            type="checkbox"
            checked={fields.wifiHidden}
            onChange={(event) => update("wifiHidden", event.target.checked)}
            className="size-4 accent-primary"
          />
        </label>
      </div>
    );
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField label="Full name">
        <Input
          value={fields.contactName}
          onChange={(event) => update("contactName", event.target.value)}
        />
      </FormField>
      <FormField label="Company (optional)">
        <Input
          value={fields.contactCompany}
          onChange={(event) => update("contactCompany", event.target.value)}
        />
      </FormField>
      <FormField label="Phone (optional)">
        <Input
          type="tel"
          value={fields.contactPhone}
          onChange={(event) => update("contactPhone", event.target.value)}
        />
      </FormField>
      <FormField label="Email (optional)">
        <Input
          type="email"
          value={fields.contactEmail}
          onChange={(event) => update("contactEmail", event.target.value)}
        />
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="Website (optional)">
          <Input
            type="url"
            value={fields.contactWebsite}
            onChange={(event) => update("contactWebsite", event.target.value)}
          />
        </FormField>
      </div>
    </div>
  );
}

function downloadFile(content: string, type: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href =
    type === "image/png"
      ? content
      : URL.createObjectURL(new Blob([content], { type }));
  anchor.download = fileName;
  anchor.click();
  if (type !== "image/png") URL.revokeObjectURL(anchor.href);
}

export function QrGeneratorStudio() {
  const [mode, setMode] = useState<QrMode>("url");
  const [fields, setFields] = useState<QrFields>(defaultQrFields);
  const [foreground, setForeground] = useState("#111827");
  const [background, setBackground] = useState("#ffffff");
  const [size, setSize] = useState(512);
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const payload = useMemo(() => buildQrPayload(mode, fields), [mode, fields]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!payload) {
        setDataUrl("");
        setError("Complete the required field to generate your QR code.");
        return;
      }
      QRCode.toDataURL(payload, {
        width: size,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: foreground, light: background },
      })
        .then((value) => {
          if (!cancelled) {
            setDataUrl(value);
            setError("");
          }
        })
        .catch(() => {
          if (!cancelled)
            setError("This content could not be converted into a QR code.");
        });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [payload, foreground, background, size]);

  const update = <K extends keyof QrFields>(key: K, value: QrFields[K]) =>
    setFields((current) => ({ ...current, [key]: value }));

  const downloadSvg = async () => {
    if (!payload) return;
    const svg = await QRCode.toString(payload, {
      type: "svg",
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: foreground, light: background },
    });
    downloadFile(svg, "image/svg+xml", `eazytools-${mode}-qr.svg`);
  };

  const copyPayload = async () => {
    if (!payload) return;
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success("QR content copied.");
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-white/10 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-sm font-medium text-primary">
            <QrCode className="size-5" /> EazyTool QR Studio
          </div>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Create a QR code for almost anything.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Turn a URL, email, phone number, Wi-Fi network, message, SMS, or
            contact into a scannable QR code. Your content stays in your
            browser.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.25fr_.75fr] lg:px-8">
        <section className="space-y-7">
          <div>
            <h2 className="text-lg font-semibold">
              1. Choose what the QR code should do
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MODES.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition hover:border-primary/50 hover:bg-primary/5",
                      mode === item.id &&
                        "border-primary bg-primary/10 ring-2 ring-primary/15",
                    )}
                    aria-pressed={mode === item.id}
                  >
                    <Icon className="size-5 text-primary" />
                    <strong className="mt-3 block text-sm">{item.label}</strong>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {item.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-3xl p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <AtSign className="size-4" />
              </span>
              <div>
                <h2 className="font-semibold">2. Add your information</h2>
                <p className="text-sm text-muted-foreground">
                  The preview updates automatically.
                </p>
              </div>
            </div>
            <EditorFields mode={mode} fields={fields} update={update} />
          </div>

          <div className="glass rounded-3xl p-6 sm:p-8">
            <h2 className="font-semibold">3. Customize your design</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <FormField label="QR color">
                <Input
                  type="color"
                  value={foreground}
                  onChange={(event) => setForeground(event.target.value)}
                  className="cursor-pointer p-1"
                />
              </FormField>
              <FormField label="Background">
                <Input
                  type="color"
                  value={background}
                  onChange={(event) => setBackground(event.target.value)}
                  className="cursor-pointer p-1"
                />
              </FormField>
              <FormField label="Download size">
                <Select
                  value={String(size)}
                  onValueChange={(value) => setSize(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="256">256 × 256</SelectItem>
                    <SelectItem value="512">512 × 512</SelectItem>
                    <SelectItem value="1024">1024 × 1024</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-primary/10">
            <div className="border-b px-6 py-5">
              <h2 className="font-semibold">Live preview</h2>
              <p className="text-sm text-muted-foreground">
                Scan it with another device to test it.
              </p>
            </div>
            <div className="grid min-h-[390px] place-items-center bg-[radial-gradient(circle_at_center,hsl(var(--primary)/.09),transparent_65%)] p-8">
              {dataUrl ? (
                <div className="rounded-3xl bg-white p-5 shadow-xl">
                  <Image
                    src={dataUrl}
                    alt={`${mode} QR code preview`}
                    width={280}
                    height={280}
                    unoptimized
                    priority
                  />
                </div>
              ) : (
                <div className="max-w-xs text-center">
                  <Smartphone className="mx-auto size-12 text-muted-foreground/40" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    {error || "Your QR code preview will appear here."}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-3 border-t p-6">
              <Button
                className="w-full"
                disabled={!dataUrl}
                onClick={() =>
                  dataUrl &&
                  downloadFile(dataUrl, "image/png", `eazytools-${mode}-qr.png`)
                }
              >
                <Download className="size-4" /> Download PNG
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                disabled={!payload}
                onClick={() => void downloadSvg()}
              >
                <Download className="size-4" /> Download SVG
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={!payload}
                onClick={() => void copyPayload()}
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}{" "}
                {copied ? "Copied" : "Copy QR content"}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setFields(defaultQrFields);
                  setForeground("#111827");
                  setBackground("#ffffff");
                  setSize(512);
                }}
              >
                <RefreshCcw className="size-4" /> Reset
              </Button>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            QR codes are generated on your device. EazyTool does not upload or
            store the information entered here.
          </p>
        </aside>
      </div>
    </main>
  );
}
