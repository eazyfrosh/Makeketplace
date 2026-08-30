import { MapPin, Phone } from "lucide-react";

import type { WebsiteConfig } from "@/lib/website/types";

/**
 * The first entry in the template registry (see ./index.ts) — a generic,
 * light, real-website-looking one-pager. Deliberately styled independently
 * of Nexova's own dark theme (plain Tailwind neutrals + the config's own
 * brandColor via inline styles, since a runtime hex value can't be a static
 * Tailwind class) so the preview actually looks like a website, not part of
 * the Nexova dashboard chrome around it.
 */
export function DefaultTemplate({ config }: { config: WebsiteConfig }) {
  const initial = config.siteName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-full bg-white text-neutral-900">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          {config.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied URL, not an optimizable local/remote asset
            <img src={config.logoUrl} alt={`${config.siteName} logo`} className="h-9 w-9 rounded-lg object-contain" />
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: config.brandColor }}
            >
              {initial}
            </span>
          )}
          <span className="font-semibold tracking-tight">{config.siteName}</span>
        </div>
        <a
          href="#contact"
          className="rounded-full px-4 py-1.5 text-sm font-medium text-white"
          style={{ backgroundColor: config.brandColor }}
        >
          Contact
        </a>
      </header>

      <section className="px-6 py-16 text-center sm:px-10 sm:py-24">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{config.siteName}</h1>
        {config.tagline && <p className="mx-auto mt-4 max-w-xl text-neutral-500 sm:text-lg">{config.tagline}</p>}
        <a
          href="#contact"
          className="mt-8 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: config.brandColor }}
        >
          Get in touch
        </a>
      </section>

      <section className="border-t border-neutral-200 px-6 py-14 sm:px-10">
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
          {["Quality service", "Trusted locally", "Always available"].map((title) => (
            <div key={title} className="rounded-xl border border-neutral-200 p-5 text-center">
              <div
                className="mx-auto mb-3 h-1.5 w-10 rounded-full"
                style={{ backgroundColor: config.brandColor }}
              />
              <p className="text-sm font-semibold">{title}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="border-t border-neutral-200 bg-neutral-50 px-6 py-14 sm:px-10">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <h2 className="text-center text-xl font-bold">Get in touch</h2>
          {config.phone && (
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
              <Phone className="size-4 shrink-0" style={{ color: config.brandColor }} />
              <span className="text-sm">{config.phone}</span>
            </div>
          )}
          {config.address && (
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
              <MapPin className="size-4 shrink-0" style={{ color: config.brandColor }} />
              <span className="text-sm">{config.address}</span>
            </div>
          )}
          {!config.phone && !config.address && (
            <p className="text-center text-sm text-neutral-400">
              Add a phone number or address in the editor to show contact details here.
            </p>
          )}
        </div>
      </section>

      <footer className="border-t border-neutral-200 px-6 py-6 text-center text-xs text-neutral-400 sm:px-10">
        © {new Date().getFullYear()} {config.siteName}. All rights reserved.
      </footer>
    </div>
  );
}
