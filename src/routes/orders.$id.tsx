import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore } from "@/lib/store";
import { findProduct } from "@/lib/mock-data";
import { OrderTimeline, OrderStatusBadge } from "@/components/OrderTimeline";
import { formatDate, formatPrice, whatsappLink } from "@/lib/format";
import { CheckCircle2, MessageCircle, QrCode } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/orders/$id")({
  validateSearch: z.object({ confirmed: z.boolean().optional() }),
  head: () => ({ meta: [{ title: "Order — Metacare" }] }),
  component: OrderPage,
});

const METACARE_WHATSAPP = "0912345678"; // demo store number

function OrderPage() {
  const { id } = Route.useParams();
  const { confirmed } = Route.useSearch();
  const { t, lang } = useI18n();
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const setStatus = useStore((s) => s.setOrderStatus);

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
    ? `مرحباً ميتاكير،\nرقم الطلب: ${order.number}\nالاسم: ${order.customer.name}\nالجوال: ${order.customer.phone}`
    : `Hi Metacare,\nOrder: ${order.number}\nName: ${order.customer.name}\nPhone: ${order.customer.phone}`;
  const waHref = whatsappLink(METACARE_WHATSAPP, waMessage);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        {confirmed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 overflow-hidden rounded-3xl gradient-hero p-8 text-primary-foreground shadow-elevated"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-foreground/15">
                <CheckCircle2 className="h-6 w-6" />
              </div>
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
              <a
                href={waHref} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-success px-5 py-2.5 text-sm font-medium text-success-foreground shadow-glow hover:opacity-95"
              >
                <MessageCircle className="h-4 w-4" />
                {t.confirm.contactWhatsapp}
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
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(order.createdAt, lang)}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <OrderTimeline status={order.status} history={order.history} />

              {order.status === "shipping" && (
                <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-4">
                  <div className="flex items-start gap-3">
                    <QrCode className="h-5 w-5 shrink-0 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{t.account.confirmDelivery}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t.account.scanQr}</p>
                      <button
                        onClick={() => setStatus(order.id, "delivered")}
                        className="mt-3 inline-flex items-center gap-2 rounded-full gradient-brand px-4 py-2 text-xs font-medium text-primary-foreground shadow-glow"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        {t.account.confirmDelivery}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-glass">
              <h3 className="mb-3 font-display text-lg text-foreground">{lang === "ar" ? "المنتجات" : "Items"}</h3>
              <ul className="divide-y divide-border">
                {order.items.map((it) => {
                  const p = findProduct(it.productId);
                  if (!p) return null;
                  return (
                    <li key={it.productId} className="flex items-center gap-3 py-3">
                      <img src={p.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{p.name[lang]}</p>
                        <p className="text-xs text-muted-foreground">{lang === "ar" ? "الكمية" : "Qty"}: {it.qty}</p>
                      </div>
                      <p className="text-sm text-foreground">{formatPrice(it.price * it.qty, lang)}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <aside className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-glass">
            <h3 className="font-display text-lg text-foreground">{t.checkout.contact}</h3>
            <Info label={t.checkout.fullName} value={order.customer.name} />
            <Info label={t.checkout.phone} value={order.customer.phone} ltr />
            <Info label={t.checkout.whatsapp} value={order.customer.whatsapp} ltr />
            <div className="my-2 h-px bg-border" />
            <h3 className="font-display text-lg text-foreground">{t.checkout.address}</h3>
            <Info label={t.checkout.city} value={order.address.city} />
            <Info label={t.checkout.neighborhood} value={order.address.neighborhood} />
            <Info label={t.checkout.street} value={order.address.street} />
            {order.address.notes && <Info label={t.checkout.notes} value={order.address.notes} />}
            <div className="my-2 h-px bg-border" />
            <Info label={t.cart.subtotal} value={formatPrice(order.subtotal, lang)} />
            <Info label={t.cart.delivery} value={formatPrice(order.delivery, lang)} />
            <Info label={t.cart.total} value={formatPrice(order.total, lang)} strong />
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
