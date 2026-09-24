import type { Metadata } from "next";

import { QrGeneratorStudio } from "@/components/qr-generator/qr-generator-studio";

export const metadata: Metadata = {
  title: "QR Code Generator",
  description:
    "Create downloadable QR codes for websites, email, phone, SMS, Wi-Fi, text, and contacts.",
};

export default function QrCodeGeneratorPage() {
  return <QrGeneratorStudio />;
}
