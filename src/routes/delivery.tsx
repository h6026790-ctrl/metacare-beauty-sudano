import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { PanelShell } from "./admin";
import { MapPin, Phone, QrCode, CheckCircle2, Package, Navigation, MessageCircle, Clock } from "lucide-react";
import { sampleOrders, findCustomer, findProduct } from "@/lib/mock-data";
import { formatPrice, whatsappLink } from "@/lib/format";
import { useState } from "react";

export const Route = createFileRoute("/delivery")({
  head: () => ({ meta: [{ title: "Delivery Console — Metacare" }] }),
  component: DeliveryPanel,
});

function DeliveryPanel() {
  const { t, lang } = useI18n();
  const myJobs = sampleOrders.filter((o) => o.assignedTo?.agent === "مندوب 1");
  const active = myJobs.filter((o) => o.status === "paid" || o.status === "shipping");
  const completedToday = myJobs.filter((o) => o.status === "delivered" && o.placedAt.startsWith("2026-06-04"));
  const [scanning, setScanning] = useState<string | null>(null);

  return (
    <PanelShell title={t.panels.delivery.title} sub={t.panels.delivery.sub} accent="violet">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Package} label={lang === "ar" ? "توصيلات اليوم" : "Today's deliveries"} value={String(myJobs.length)} />
        <Stat icon={Clock} label={lang === "ar" ? "نشطة الآن" : "Active now"} value={String(active.length)} tone="warning" />
        <Stat icon={CheckCircle2} label={lang === "ar" ? "مكتملة اليوم" : "Completed today"} value={String(completedToday.length)} tone="success" />
      </div>

      {/* Job cards */}
      <h3 className="mt-6 mb-3 font-display text-xl text-foreground">{lang === "ar" ? "التوصيلات النشطة" : "Active deliveries"}</h3>
      {active.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {lang === "ar" ? "لا توجد توصيلات نشطة الآن" : "No active deliveries right now"}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {active.map((o) => {
            const c = findCustomer(o.customerId)!;
            return (
              <div key={o.number} className="rounded-2xl border border-border bg-card p-5 shadow-glass">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium tracking-wider text-foreground">{o.number}</p>
                    <p className="mt-1 text-base font-medium text-foreground">{c.name}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /><span dir="ltr">{c.phone}</span>
                    </p>
                    <p className="mt-2 inline-flex items-start gap-1.5 text-sm text-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 text-primary" />{o.address}
                    </p>
                  </div>
                  <button onClick={() => setScanning(scanning === o.number ? null : o.number)} className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl gradient-aurora transition hover:scale-[1.02]">
                    <QrCode className="h-12 w-12 text-primary" />
                  </button>
                </div>

                {/* Items summary */}
                <ul className="mt-3 space-y-1 rounded-xl bg-muted/40 p-3 text-xs">
                  {o.items.map((it) => {
                    const p = findProduct(it.productId);
                    return p && <li key={it.productId} className="flex justify-between text-foreground"><span className="line-clamp-1">{p.name[lang]} × {it.qty}</span></li>;
                  })}
                  <li className="flex justify-between border-t border-border pt-2 font-medium text-foreground"><span>{lang === "ar" ? "الإجمالي للتحصيل" : "Collect"}</span><span>{formatPrice(o.total, lang)}</span></li>
                </ul>

                {/* QR scan area */}
                {scanning === o.number && (
                  <div className="mt-3 rounded-xl border border-accent/30 bg-accent/5 p-4 text-center">
                    <div className="mx-auto grid h-32 w-32 place-items-center rounded-xl border-2 border-dashed border-accent/40 bg-card">
                      <QrCode className="h-16 w-16 text-accent" />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{lang === "ar" ? "اطلبي من العميلة مسح هذا الرمز لتأكيد الاستلام" : "Ask customer to scan to confirm delivery"}</p>
                    <button className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success px-4 py-1.5 text-xs font-medium text-success-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5" />{lang === "ar" ? "تأكيد التسليم" : "Mark delivered"}
                    </button>
                  </div>
                )}

                {/* Action row */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <a href={`tel:${c.phone}`} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted">
                    <Phone className="h-3.5 w-3.5" />{lang === "ar" ? "اتصال" : "Call"}
                  </a>
                  <a href={whatsappLink(c.whatsapp, `مرحباً، أنا مندوب ميتاكير. أنا في الطريق لتسليم طلبكِ ${o.number}.`)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-success px-3 py-2 text-xs font-medium text-success-foreground hover:opacity-90">
                    <MessageCircle className="h-3.5 w-3.5" />{lang === "ar" ? "واتساب" : "WhatsApp"}
                  </a>
                  <button className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted">
                    <Navigation className="h-3.5 w-3.5" />{lang === "ar" ? "خريطة" : "Map"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed today */}
      {completedToday.length > 0 && (
        <>
          <h3 className="mt-8 mb-3 font-display text-xl text-foreground">{lang === "ar" ? "مكتملة اليوم" : "Completed today"}</h3>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-glass">
            {completedToday.map((o) => {
              const c = findCustomer(o.customerId)!;
              return (
                <li key={o.number} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-mono text-xs tracking-wider text-foreground">{o.number}</p>
                    <p className="text-xs text-muted-foreground">{c.name}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />{lang === "ar" ? "تم التسليم" : "Delivered"}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </PanelShell>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Clock; label: string; value: string; tone?: "warning" | "success" }) {
  const ring = tone === "warning" ? "bg-warning/15 text-warning-foreground" : tone === "success" ? "bg-success/15 text-success" : "gradient-brand text-primary-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-glass">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${ring}`}><Icon className="h-4 w-4" /></span>
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-display text-2xl text-foreground">{value}</p></div>
      </div>
    </div>
  );
}
