// Shared phone helpers (server-only).
export function normalizePhone(input: string): string {
  const p = (input || "").trim().replace(/\s+/g, "");
  if (p.startsWith("+")) return p;
  if (p.startsWith("00")) return "+" + p.slice(2);
  if (p.startsWith("0")) return "+249" + p.slice(1);
  if (p.startsWith("249")) return "+" + p;
  return "+249" + p;
}

export function phoneToEmail(phone: string) {
  // synthetic, never delivered to a real inbox
  return `${phone.replace(/[^0-9]/g, "")}@phone.metacare.local`;
}
