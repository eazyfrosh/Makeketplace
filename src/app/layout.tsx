import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthProvider } from "@/context/auth-context";
import { RefCapture } from "@/components/affiliate/ref-capture";

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
  keywords: [
    "digital services marketplace",
    "custom software development",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
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
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
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
