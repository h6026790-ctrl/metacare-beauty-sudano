import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useMyOrder, useAddToCart } from "@/lib/api/queries";
import { OrderTimeline, OrderStatusBadge } from "@/components/OrderTimeline";
import { formatDate, formatPrice, whatsappLink } from "@/lib/format";
import { CheckCircle2, MessageCircle, QrCode, ChevronLeft, ChevronRight, RotateCcw, LifeBuoy } from "lucide-react";
import { motion } from "framer-motion";
import { METACARE_WHATSAPP } from "@/lib/config";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/orders/$id")({
  validateSearch: z.object({ confirmed: z.boolean().optional() }),
  head: () => ({ meta: [{ title: "Order — Metacare" }] }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const { confirmed } = Route.useSearch();
  const { t, lang } = useI18n();
  const { data: order, refetch } = useMyOrder(id);
  const addToCart = useAddToCart();
  const [token, setToken] = useState("");
  const Chevron = lang === "ar" ? ChevronRight : ChevronLeft;

  const reorder = async () => {
    const ids = ((order as any)?.order_items ?? []).map((i: any) => i.product_id).filter(Boolean);
    for (const pid of ids) {
      try { await addToCart.mutateAsync(pid); } catch { /* skip unavailable */ }
    }
    if (ids.length) toast.success(t.customer.reordered);
  };

  if (!order) {
    return (
      <AppShell>
        <div className="p-16 text-center text-muted-foreground">
          {lang === "ar" ? "لم يتم العثور على الطلب" : "Order not found"}
          <div className="mt-4"><Link className="text-primary hover:underline" to="/">{t.confirm.backHome}</Link></div>
        </div>
      </AppShell>
    );
  }

  const waMessage = lang === "ar"
    ? `مرحباً ميتاكير،\nرقم الطلب: ${order.number}\nالاسم: ${order.contact_name}\nالجوال: ${order.contact_phone}`
    : `Hi Metacare,\nOrder: ${order.number}\nName: ${order.contact_name}\nPhone: ${order.contact_phone}`;
  const waHref = whatsappLink(METACARE_WHATSAPP, waMessage);

  const confirmDelivery = async () => {
    if (!token.trim()) { toast.error(lang === "ar" ? "أدخلي رمز QR" : "Enter QR token"); return; }
    const { error } = await supabase.rpc("confirm_delivery_by_qr", { _order_id: id, _token: token.trim() });
    if (error) toast.error(error.message);
    else { toast.success(lang === "ar" ? "تم تأكيد الاستلام" : "Delivery confirmed"); setToken(""); refetch(); }
  };

  // Build timeline-style history from order_status_history
  const history = (order.order_status_history ?? []).map((h: any) => ({ status: h.status, at: h.at }));

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/orders" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <Chevron className="h-3.5 w-3.5" />{t.customer.ordersCenter}
        </Link>

        {confirmed && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 overflow-hidden rounded-3xl gradient-hero p-8 text-primary-foreground shadow-elevated">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-foreground/15"><CheckCircle2 className="h-6 w-6" /></div>
              <div>
                <h1 className="font-display text-3xl">{t.confirm.title}</h1>
                <p className="mt-1 text-sm opacity-90">{t.confirm.sub}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-primary-foreground/10 px-4 py-2.5 text-sm backdrop-blur">
                <span className="opacity-80">{t.confirm.orderNo}: </span>
                <span className="font-mono font-medium tracking-wider">{order.number}</span>
              </div>
              <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-success px-5 py-2.5 text-sm font-medium text-success-foreground shadow-glow hover:opacity-95">
                <MessageCircle className="h-4 w-4" />{t.confirm.contactWhatsapp}
              </a>
            </div>
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-glass">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t.confirm.orderNo}</p>
                  <h2 className="font-display text-2xl text-foreground">{order.number}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(order.placed_at, lang)}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <OrderTimeline status={order.status} history={history} />

              {order.status === "shipping" && (
                <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-4">
                  <div className="flex items-start gap-3">
                    <QrCode className="h-5 w-5 shrink-0 text-primary" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-foreground">{t.account.confirmDelivery}</p>
                      <p className="text-xs text-muted-foreground">{t.account.scanQr}</p>
                      <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="QR token" dir="ltr" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      <button onClick={confirmDelivery} className="inline-flex items-center gap-2 rounded-full gradient-brand px-4 py-2 text-xs font-medium text-primary-foreground shadow-glow">
                        <QrCode className="h-3.5 w-3.5" />{t.account.confirmDelivery}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={reorder} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-muted">
                <RotateCcw className="h-4 w-4" />{t.customer.reorder}
              </button>
              <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-success px-5 text-sm font-medium text-success-foreground hover:opacity-95">
                <MessageCircle className="h-4 w-4" />{t.customer.contactSupport}
              </a>
              <Link to="/support" className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-muted">
                <LifeBuoy className="h-4 w-4" />{t.customer.support}
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-glass">
              <h3 className="mb-3 font-display text-lg text-foreground">{lang === "ar" ? "المنتجات" : "Items"}</h3>
              <ul className="divide-y divide-border">
                {(order.order_items ?? []).map((it: any) => (
                  <li key={it.id} className="flex items-center gap-3 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{it.name_snapshot}</p>
                      <p className="text-xs text-muted-foreground">{lang === "ar" ? "الكمية" : "Qty"}: {it.qty}</p>
                    </div>
                    <p className="text-sm text-foreground">{formatPrice(Number(it.price_sdg) * it.qty, lang)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-glass">
            <h3 className="font-display text-lg text-foreground">{t.checkout.contact}</h3>
            <Info label={t.checkout.fullName} value={order.contact_name} />
            <Info label={t.checkout.phone} value={order.contact_phone} ltr />
            <Info label={t.checkout.whatsapp} value={order.contact_whatsapp} ltr />
            <div className="my-2 h-px bg-border" />
            <h3 className="font-display text-lg text-foreground">{t.checkout.address}</h3>
            <Info label={t.checkout.state} value={order.address_state} />
            <Info label={t.checkout.city} value={order.address_city} />
            {order.address_neighborhood && <Info label={t.checkout.neighborhood} value={order.address_neighborhood} />}
            <Info label={t.checkout.street} value={order.address_street} />
            {order.address_notes && <Info label={t.checkout.notes} value={order.address_notes} />}
            <div className="my-2 h-px bg-border" />
            <Info label={t.cart.subtotal} value={formatPrice(Number(order.subtotal_sdg), lang)} />
            <Info label={t.cart.delivery} value={formatPrice(Number(order.delivery_sdg), lang)} />
            <Info label={t.cart.total} value={formatPrice(Number(order.total_sdg), lang)} strong />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Info({ label, value, ltr, strong }: { label: string; value: string; ltr?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-display text-base text-foreground" : "text-foreground"} dir={ltr ? "ltr" : undefined}>{value}</span>
    </div>
  );
}
