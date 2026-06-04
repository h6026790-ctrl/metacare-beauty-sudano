import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { PanelShell } from "./admin";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import { sampleOrders, findCustomer, findProduct } from "@/lib/mock-data";
import type { OrderStatus } from "@/lib/types";
import { formatPrice, whatsappLink } from "@/lib/format";
import {
  MessageCircle, Truck, StickyNote, CheckCircle2, Search, Filter,
  Clock, AlertCircle, Phone, MapPin, Package,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Customer Service — Metacare" }] }),
  component: StaffPanel,
});

const FILTERS: { key: "all" | OrderStatus; ar: string; en: string }[] = [
  { key: "all", ar: "الكل", en: "All" },
  { key: "new", ar: "جديد", en: "New" },
  { key: "review", ar: "قيد المراجعة", en: "Review" },
  { key: "paid", ar: "تم الدفع", en: "Paid" },
  { key: "shipping", ar: "في الطريق", en: "Shipping" },
];

function StaffPanel() {
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(sampleOrders[0]?.number ?? null);

  const myOrders = sampleOrders.filter((o) => o.assignedTo?.staff === "خدمة 1");
  const filtered = myOrders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (q && !o.number.includes(q) && !findCustomer(o.customerId)?.name.includes(q)) return false;
    return true;
  });
  const selectedOrder = sampleOrders.find((o) => o.number === selected);
  const selectedCust = selectedOrder && findCustomer(selectedOrder.customerId);

  const counts = {
    new: myOrders.filter((o) => o.status === "new").length,
    review: myOrders.filter((o) => o.status === "review").length,
    paid: myOrders.filter((o) => o.status === "paid").length,
    shipping: myOrders.filter((o) => o.status === "shipping").length,
  };

  return (
    <PanelShell title={t.panels.staff.title} sub={t.panels.staff.sub} accent="accent">
      {/* Queue summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QueueStat label={lang === "ar" ? "طلبات جديدة" : "New"} count={counts.new} icon={AlertCircle} tone="warning" />
        <QueueStat label={lang === "ar" ? "قيد المراجعة" : "Under review"} count={counts.review} icon={Clock} />
        <QueueStat label={lang === "ar" ? "تم الدفع" : "Paid"} count={counts.paid} icon={CheckCircle2} tone="success" />
        <QueueStat label={lang === "ar" ? "في الطريق" : "Out for delivery"} count={counts.shipping} icon={Truck} />
      </div>

      {/* Master/Detail */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_400px]">
        {/* List */}
        <div className="rounded-2xl border border-border bg-card shadow-glass">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" style={{ insetInlineStart: "0.75rem" }} />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={lang === "ar" ? "بحث برقم الطلب أو الاسم" : "Search order or name"} className="h-9 rounded-full bg-muted/60 ps-9 text-xs" />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              {FILTERS.map((f) => (
                <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${filter === f.key ? "gradient-brand text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  {lang === "ar" ? f.ar : f.en}
                </button>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-border">
            {filtered.length === 0 && (
              <li className="p-8 text-center text-sm text-muted-foreground">{lang === "ar" ? "لا توجد طلبات تطابق الفلاتر" : "No orders match the filters"}</li>
            )}
            {filtered.map((o) => {
              const c = findCustomer(o.customerId);
              return (
                <li key={o.number}>
                  <button
                    onClick={() => setSelected(o.number)}
                    className={`flex w-full flex-wrap items-center justify-between gap-3 p-4 text-start transition ${selected === o.number ? "bg-primary-soft" : "hover:bg-muted/40"}`}
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium tracking-wider text-foreground">{o.number}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{c?.name} • <span dir="ltr">{c?.phone}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatPrice(o.total, lang)}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Detail */}
        <aside className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-glass lg:sticky lg:top-24">
          {!selectedOrder || !selectedCust ? (
            <p className="p-6 text-center text-sm text-muted-foreground">{lang === "ar" ? "اختاري طلباً لعرض التفاصيل" : "Select an order to view details"}</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{lang === "ar" ? "رقم الطلب" : "Order"}</p>
                  <p className="font-mono text-base font-medium tracking-wider text-foreground">{selectedOrder.number}</p>
                </div>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>

              <div className="my-2 h-px bg-border" />

              <p className="text-sm font-medium text-foreground">{selectedCust.name}</p>
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3" /><span dir="ltr">{selectedCust.phone}</span></p>
              <p className="inline-flex items-start gap-1.5 text-xs text-foreground"><MapPin className="mt-0.5 h-3 w-3 text-primary" />{selectedOrder.address}</p>

              <div className="my-2 h-px bg-border" />

              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Package className="h-3 w-3" /> {lang === "ar" ? "المنتجات" : "Items"}</p>
              <ul className="space-y-1.5 text-xs">
                {selectedOrder.items.map((it) => {
                  const p = findProduct(it.productId);
                  return p && <li key={it.productId} className="flex justify-between text-foreground"><span className="line-clamp-1">{p.name[lang]} × {it.qty}</span><span className="text-muted-foreground">{formatPrice(p.price * it.qty, lang)}</span></li>;
                })}
              </ul>

              <div className="my-2 h-px bg-border" />
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t.cart.total}</span><span className="font-display text-base text-foreground">{formatPrice(selectedOrder.total, lang)}</span></div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href={whatsappLink(selectedCust.whatsapp, `مرحباً ${selectedCust.name}،\nبخصوص الطلب ${selectedOrder.number}`)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-success px-3 py-2 text-xs font-medium text-success-foreground hover:opacity-90">
                  <MessageCircle className="h-3.5 w-3.5" />{lang === "ar" ? "واتساب" : "WhatsApp"}
                </a>
                <Action icon={CheckCircle2} label={lang === "ar" ? "تأكيد الدفع" : "Confirm payment"} />
                <Action icon={Truck} label={lang === "ar" ? "إسناد مندوب" : "Assign agent"} />
                <Action icon={StickyNote} label={lang === "ar" ? "ملاحظة" : "Add note"} />
              </div>
            </>
          )}
        </aside>
      </div>
    </PanelShell>
  );
}

function QueueStat({ label, count, icon: Icon, tone }: { label: string; count: number; icon: typeof Clock; tone?: "warning" | "success" }) {
  const ring = tone === "warning" ? "bg-warning/15 text-warning-foreground" : tone === "success" ? "bg-success/15 text-success" : "gradient-brand text-primary-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-glass">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${ring}`}><Icon className="h-4 w-4" /></span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-2xl text-foreground">{count}</p>
        </div>
      </div>
    </div>
  );
}

function Action({ icon: Icon, label }: { icon: typeof MessageCircle; label: string }) {
  return (
    <button className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">
      <Icon className="h-3.5 w-3.5" />{label}
    </button>
  );
}
