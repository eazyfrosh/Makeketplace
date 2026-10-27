import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthProvider } from "@/context/auth-context";
import { RefCapture } from "@/components/affiliate/ref-capture";
import { TelegramLiveChat } from "@/components/support/telegram-live-chat";
import { TelegramChannelInvite } from "@/components/support/telegram-channel-invite";
import { MobileTaskNav } from "@/components/layout/mobile-task-nav";
import { AnalyticsConsent } from "@/components/analytics/analytics-consent";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EazyTool — Practical Digital Tools for Professionals",
    template: "%s · EazyTool",
  },
  description:
    "EazyTool gives professionals fast, dependable digital tools for receipts, platforms, websites, templates, and everyday business work.",
  icons: {
    icon: [
      { url: "/favicon-32.png?v=20261012", type: "image/png", sizes: "32x32" },
      { url: "/favicon.svg?v=20261012", type: "image/svg+xml" },
    ],
    shortcut: "/favicon-32.png?v=20261012",
    apple: [{ url: "/apple-touch-icon.png?v=20261012", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest?v=20261012",
  keywords: [
    "digital services marketplace",
    "QR Code Generator",
    "SaaS platforms",
    "website design",
    "receipt generator",
  ],
  openGraph: {
    title: "EazyTool — Practical Digital Tools for Professionals",
    description:
      "Fast, dependable digital tools for receipts, platforms, websites, and professional workflows.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script id="eazytool-ga4-consent-default" dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
          window.gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
        ` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <a href="#main-content" className="sr-only z-[100] rounded-md bg-background px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <RefCapture />
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main id="main-content" className="flex-1">{children}</main>
              <SiteFooter />
            </div>
            <MobileTaskNav />
            <TelegramLiveChat />
            <TelegramChannelInvite />
            <Suspense fallback={null}><AnalyticsConsent /></Suspense>
            <Toaster
              position="bottom-right"
              theme="dark"
              toastOptions={{
                classNames: {
                  toast: "glass !text-foreground",
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
