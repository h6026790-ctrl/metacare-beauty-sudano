import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { PanelShell } from "./admin";
import { MapPin, Phone, QrCode } from "lucide-react";

export const Route = createFileRoute("/delivery")({
  head: () => ({ meta: [{ title: "Delivery — Metacare" }] }),
  component: DeliveryPanel,
});

const DELIVERIES = [
  { number: "MC260604-2173", customer: "هدى علي", phone: "0911223344", address: "ود مدني — حي الثورة، شارع الجامعة" },
  { number: "MC260603-9981", customer: "آلاء عثمان", phone: "0918887766", address: "ود مدني — حي الموردة، خلف المستشفى" },
];

function DeliveryPanel() {
  const { t, lang } = useI18n();
  return (
    <PanelShell title={t.panels.delivery.title} sub={t.panels.delivery.sub} accent="violet">
      <div className="grid gap-3 md:grid-cols-2">
        {DELIVERIES.map((d) => (
          <div key={d.number} className="rounded-2xl border border-border bg-card p-5 shadow-glass">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-medium tracking-wider text-foreground">{d.number}</p>
                <p className="mt-1 text-base font-medium text-foreground">{d.customer}</p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3" /><span dir="ltr">{d.phone}</span></p>
                <p className="mt-2 inline-flex items-start gap-1.5 text-sm text-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 text-primary" />{d.address}</p>
              </div>
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl gradient-aurora">
                <QrCode className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-full bg-success px-4 py-2 text-xs font-medium text-success-foreground hover:opacity-90">
                {lang === "ar" ? "بدء التوصيل" : "Start delivery"}
              </button>
              <button className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted">
                {lang === "ar" ? "تفاصيل الطلب" : "Order details"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
