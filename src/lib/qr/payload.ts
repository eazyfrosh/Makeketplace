export type QrMode =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "wifi"
  | "contact";

export interface QrFields {
  url: string;
  text: string;
  email: string;
  subject: string;
  body: string;
  phone: string;
  smsPhone: string;
  smsMessage: string;
  wifiName: string;
  wifiPassword: string;
  wifiSecurity: "WPA" | "WEP" | "nopass";
  wifiHidden: boolean;
  contactName: string;
  contactCompany: string;
  contactPhone: string;
  contactEmail: string;
  contactWebsite: string;
}

export const defaultQrFields: QrFields = {
  url: "https://eazytools.app",
  text: "Welcome to EazyTool",
  email: "hello@example.com",
  subject: "Hello",
  body: "I would like to get in touch.",
  phone: "+2348000000000",
  smsPhone: "+2348000000000",
  smsMessage: "Hello!",
  wifiName: "My WiFi",
  wifiPassword: "",
  wifiSecurity: "WPA",
  wifiHidden: false,
  contactName: "",
  contactCompany: "",
  contactPhone: "",
  contactEmail: "",
  contactWebsite: "",
};

function cleanPhone(value: string) {
  return value.trim().replace(/[^+\d*#]/g, "");
}

function escapeWifi(value: string) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function escapeVcard(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function normalizedUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    return new URL(candidate).toString();
  } catch {
    return "";
  }
}

export function buildQrPayload(mode: QrMode, fields: QrFields) {
  switch (mode) {
    case "url":
      return normalizedUrl(fields.url);
    case "text":
      return fields.text.trim();
    case "email": {
      const email = fields.email.trim();
      if (!email) return "";
      const params = new URLSearchParams();
      if (fields.subject.trim()) params.set("subject", fields.subject.trim());
      if (fields.body.trim()) params.set("body", fields.body.trim());
      const query = params.toString();
      return `mailto:${email}${query ? `?${query}` : ""}`;
    }
    case "phone": {
      const phone = cleanPhone(fields.phone);
      return phone ? `tel:${phone}` : "";
    }
    case "sms": {
      const phone = cleanPhone(fields.smsPhone);
      return phone
        ? `SMSTO:${phone}:${fields.smsMessage.trim().replace(/\r?\n/g, " ")}`
        : "";
    }
    case "wifi": {
      const name = fields.wifiName.trim();
      if (!name) return "";
      const password =
        fields.wifiSecurity === "nopass"
          ? ""
          : `P:${escapeWifi(fields.wifiPassword)};`;
      return `WIFI:T:${fields.wifiSecurity};S:${escapeWifi(name)};${password}H:${fields.wifiHidden ? "true" : "false"};;`;
    }
    case "contact": {
      if (!fields.contactName.trim()) return "";
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${escapeVcard(fields.contactName.trim())}`,
      ];
      if (fields.contactCompany.trim())
        lines.push(`ORG:${escapeVcard(fields.contactCompany.trim())}`);
      if (cleanPhone(fields.contactPhone))
        lines.push(`TEL:${cleanPhone(fields.contactPhone)}`);
      if (fields.contactEmail.trim())
        lines.push(`EMAIL:${escapeVcard(fields.contactEmail.trim())}`);
      const website = normalizedUrl(fields.contactWebsite);
      if (website) lines.push(`URL:${website}`);
      lines.push("END:VCARD");
      return lines.join("\n");
    }
  }
}
