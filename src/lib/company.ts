// ─────────────────────────────────────────────────────────────
// COMPANY INFORMATION — single source of truth
// Update business contact details HERE ONLY. Every customer-facing
// surface (support, checkout, contact, order pages, auth) reads from
// this module. Do not hardcode phone / WhatsApp numbers elsewhere.
// ─────────────────────────────────────────────────────────────

export const COMPANY = {
  name: { ar: "ميتاكير بيوتي", en: "Metacare Beauty" },
  /** Local format used for wa.me links after normalization. */
  whatsapp: "0993373874",
  /** International display form of the WhatsApp/business line. */
  whatsappDisplay: "+249 99 337 3874",
  phone: "0993373874",
  phoneDisplay: "+249 99 337 3874",

  email: "care@metacare.sd",
  address: {
    ar: "ود مدني، الجزيرة، السودان",
    en: "Wad Madani, Gezira, Sudan",
  },
  hours: {
    ar: "السبت – الخميس، ٩ ص – ٩ م",
    en: "Sat – Thu, 9 AM – 9 PM",
  },
} as const;

/** wa.me digits (country code + number, no +, no leading zero). */
export function waDigits(local: string = COMPANY.whatsapp) {
  const digits = local.replace(/\D/g, "");
  if (digits.startsWith("249")) return digits;
  return `249${digits.replace(/^0/, "")}`;
}
