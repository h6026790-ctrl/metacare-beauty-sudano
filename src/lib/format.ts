import type { Lang } from "@/i18n/dict";

export function formatPrice(amount: number, lang: Lang) {
  const formatted = new Intl.NumberFormat(lang === "ar" ? "ar-SD" : "en-SD").format(amount);
  return lang === "ar" ? `${formatted} ج.س` : `${formatted} SDG`;
}

export function formatDate(iso: string, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SD" : "en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export function whatsappLink(phone: string, message: string) {
  const clean = phone.replace(/[^0-9]/g, "");
  // Strip leading zero and prepend Sudan country code if missing.
  const normalised = clean.startsWith("249") ? clean : `249${clean.replace(/^0/, "")}`;
  return `https://wa.me/${normalised}?text=${encodeURIComponent(message)}`;
}
