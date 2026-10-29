import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact EazyTool",
  description: "Get help with EazyTool services and your account.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
