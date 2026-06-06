// Live Delivery dashboard — shows agent's assignments + QR code for customer to scan.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyDeliveries } from "@/lib/api/ops.functions";
import { formatPrice, whatsappLink } from "@/lib/format";
import { MapPin, Phone, MessageCircle, Navigation, Package } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export const Route = createFileRoute("/delivery")({
  head: () => ({ meta: [{ title: "Delivery Console — Metacare" }] }),
  component: DeliveryPanel,
});

function DeliveryPanel() {
  const { t, lang } = useI18n();
  const { user, isAgent, isAdmin, loading } = useAuth();
  const listFn = useServerFn(listMyDeliveries);
  const q = useQuery({ queryKey: ["my-deliveries"], queryFn: () => listFn(), enabled: !!user && (isAgent || isAdmin) });

  if (loading) return <AppShell><div className="p-16 text-center">…</div></AppShell>;
  if (!user || (!isAgent && !isAdmin)) {
    return <AppShell><div className="p-16 text-center text-muted-foreground">{lang === "ar" ? "هذه اللوحة للمندوبين فقط" : "Delivery agents only"}<div className="mt-4"><Link to="/" className="text-primary hover:underline">{t.confirm.backHome}</Link></div></div></AppShell>;
  }

  const all = (q.data ?? []) as any[];
  const active = all.filter((d) => !d.completed_at);
  const done = all.filter((d) => !!d.completed_at);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-violet to-primary p-6 text-primary-foreground shadow-elevated md:p-8">
          <h1 className="font-display text-3xl md:text-4xl">{t.panels.delivery.title}</h1>
          <p className="mt-1 text-sm opacity-90">{t.panels.delivery.sub}</p>
        </div>

        <h3 className="mb-3 font-display text-xl text-foreground">{lang === "ar" ? "التوصيلات النشطة" : "Active deliveries"}</h3>
        {active.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{lang === "ar" ? "لا توجد توصيلات نشطة" : "No active deliveries"}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((d) => <DeliveryCard key={d.id} d={d} />)}
          </div>
        )}

        {done.length > 0 && (
          <>
            <h3 className="mt-8 mb-3 font-display text-xl text-foreground">{lang === "ar" ? "مكتملة" : "Completed"}</h3>
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-glass">
              {done.map((d) => (
                <li key={d.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-mono text-xs text-foreground">{d.order?.number}</p>
                    <p className="text-xs text-muted-foreground">{d.order?.contact_name}</p>
                  </div>
                  <span className="text-xs text-success">{lang === "ar" ? "تم التسليم" : "Delivered"}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AppShell>
  );
}

function DeliveryCard({ d }: { d: any }) {
  const { lang } = useI18n();
  const [qr, setQr] = useState<string>("");
  const expired = d.qr_expires_at && new Date(d.qr_expires_at) < new Date();

  useEffect(() => {
    if (!d.qr_token) return;
    QRCode.toDataURL(d.qr_token, { width: 200, margin: 1 }).then(setQr).catch(() => setQr(""));
  }, [d.qr_token]);

  const o = d.order ?? {};
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-medium text-foreground">{o.number}</p>
          <p className="mt-1 text-base font-medium text-foreground">{o.contact_name}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" /><span dir="ltr">{o.contact_phone}</span>
          </p>
          <p className="mt-2 inline-flex items-start gap-1.5 text-sm text-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 text-primary" />
            {o.address_neighborhood ? `${o.address_neighborhood}, ` : ""}{o.address_street}, {o.address_city}
          </p>
        </div>
        {qr ? (
          <img src={qr} alt="QR" className="h-24 w-24 rounded-xl border border-border bg-white p-1" />
        ) : (
          <div className="grid h-24 w-24 place-items-center rounded-xl bg-muted text-[10px] text-muted-foreground">QR</div>
        )}
      </div>

      <ul className="mt-3 space-y-1 rounded-xl bg-muted/40 p-3 text-xs">
        {(o.order_items ?? []).map((it: any) => (
          <li key={it.id} className="flex justify-between text-foreground"><span className="line-clamp-1">{it.name_snapshot} × {it.qty}</span></li>
        ))}
        <li className="flex justify-between border-t border-border pt-2 font-medium text-foreground">
          <span className="inline-flex items-center gap-1"><Package className="h-3 w-3" />{lang === "ar" ? "للتحصيل" : "Collect"}</span>
          <span>{formatPrice(Number(o.total_sdg ?? 0), lang)}</span>
        </li>
      </ul>

      <p className="mt-2 text-[11px] text-muted-foreground">
        {expired ? (lang === "ar" ? "انتهت صلاحية الرمز" : "QR expired") : (lang === "ar" ? "اطلبي من العميلة مسح الرمز لتأكيد الاستلام (صالح ٢٤ ساعة)" : "Ask the customer to scan to confirm (valid 24h)")}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <a href={`tel:${o.contact_phone}`} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs"><Phone className="h-3.5 w-3.5" />{lang === "ar" ? "اتصال" : "Call"}</a>
        <a href={whatsappLink(o.contact_whatsapp || o.contact_phone, `مرحباً، أنا مندوب ميتاكير. أنا في الطريق لتسليم طلبكِ ${o.number}.`)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-success px-3 py-2 text-xs font-medium text-success-foreground"><MessageCircle className="h-3.5 w-3.5" />WA</a>
        <button className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs"><Navigation className="h-3.5 w-3.5" />Map</button>
      </div>
    </div>
  );
}
