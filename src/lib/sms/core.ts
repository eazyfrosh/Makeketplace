import { SmsError, type SmsStatus } from "./types";

// Keep this list shared by the country selector and server-side validation.
// Availability still depends on Twilio trial restrictions and geo permissions.
export const SMS_COUNTRIES = [
  { code: "US", name: "United States", dial: "+1" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "FR", name: "France", dial: "+33" },
  { code: "ES", name: "Spain", dial: "+34" },
  { code: "IT", name: "Italy", dial: "+39" },
  { code: "NL", name: "Netherlands", dial: "+31" },
  { code: "IE", name: "Ireland", dial: "+353" },
  { code: "NZ", name: "New Zealand", dial: "+64" },
  { code: "AT", name: "Austria", dial: "+43" },
  { code: "BE", name: "Belgium", dial: "+32" },
  { code: "BR", name: "Brazil", dial: "+55" },
  { code: "CL", name: "Chile", dial: "+56" },
  { code: "CO", name: "Colombia", dial: "+57" },
  { code: "CZ", name: "Czechia", dial: "+420" },
  { code: "DK", name: "Denmark", dial: "+45" },
  { code: "EG", name: "Egypt", dial: "+20" },
  { code: "FI", name: "Finland", dial: "+358" },
  { code: "GH", name: "Ghana", dial: "+233" },
  { code: "GR", name: "Greece", dial: "+30" },
  { code: "HK", name: "Hong Kong", dial: "+852" },
  { code: "HU", name: "Hungary", dial: "+36" },
  { code: "IN", name: "India", dial: "+91" },
  { code: "ID", name: "Indonesia", dial: "+62" },
  { code: "JP", name: "Japan", dial: "+81" },
  { code: "KE", name: "Kenya", dial: "+254" },
  { code: "LU", name: "Luxembourg", dial: "+352" },
  { code: "MY", name: "Malaysia", dial: "+60" },
  { code: "MX", name: "Mexico", dial: "+52" },
  { code: "MA", name: "Morocco", dial: "+212" },
  { code: "NO", name: "Norway", dial: "+47" },
  { code: "PK", name: "Pakistan", dial: "+92" },
  { code: "PE", name: "Peru", dial: "+51" },
  { code: "PH", name: "Philippines", dial: "+63" },
  { code: "PL", name: "Poland", dial: "+48" },
  { code: "PT", name: "Portugal", dial: "+351" },
  { code: "QA", name: "Qatar", dial: "+974" },
  { code: "RO", name: "Romania", dial: "+40" },
  { code: "RW", name: "Rwanda", dial: "+250" },
  { code: "SA", name: "Saudi Arabia", dial: "+966" },
  { code: "SG", name: "Singapore", dial: "+65" },
  { code: "ZA", name: "South Africa", dial: "+27" },
  { code: "KR", name: "South Korea", dial: "+82" },
  { code: "SE", name: "Sweden", dial: "+46" },
  { code: "CH", name: "Switzerland", dial: "+41" },
  { code: "TZ", name: "Tanzania", dial: "+255" },
  { code: "TH", name: "Thailand", dial: "+66" },
  { code: "TR", name: "Türkiye", dial: "+90" },
  { code: "UG", name: "Uganda", dial: "+256" },
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
  { code: "VN", name: "Vietnam", dial: "+84" },
] as const;

export function normalizePhone(countryCode: string, input: string) {
  const country = SMS_COUNTRIES.find((item) => item.code === countryCode);
  if (!country) throw new SmsError("INVALID_COUNTRY", "Choose a supported country.");
  const raw = input.trim().replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(raw)) throw new SmsError("INVALID_PHONE", "Enter a valid international phone number.");
  const normalized = raw.startsWith("+") ? raw : `${country.dial}${raw.replace(/^0+/, "")}`;
  if (!/^\+[1-9]\d{7,14}$/.test(normalized) || !normalized.startsWith(country.dial)) {
    throw new SmsError("INVALID_PHONE", `Enter a phone number for ${country.name}.`);
  }
  return normalized;
}
export function calculateSegments(message:string){const text=message.trim();if(!text)throw new SmsError("EMPTY_MESSAGE","Enter a message to send.");if(text.length>1600)throw new SmsError("MESSAGE_TOO_LONG","Message must be 1,600 characters or fewer.");const gsm=/^[\x0A\x0D\x20-\x7E£¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉÄÖÑÜ§¿äöñüà^{}\\\[~\]|€]*$/u.test(text);const single=gsm?160:70,multi=gsm?153:67;return text.length<=single?1:Math.ceil(text.length/multi)}
export function safeTwilioStatus(v:string):SmsStatus{return (["queued","accepted","sending","sent","delivered","undelivered","failed"].includes(v)?v:"queued") as SmsStatus}
