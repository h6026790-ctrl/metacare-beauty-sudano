import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { useCart, useSetCartQty } from "@/lib/api/queries";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { PricePill } from "@/components/PricePill";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Metacare" }] }),
  component: CartPage,
});

const DELIVERY_FEE_SDG = 3000;

function CartPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { data, isLoading } = useCart();
  const setQty = useSetCartQty();
  const items = (data?.items ?? []) as any[];

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground">{t.cart.title}</h1>
          <p className="mt-3 text-muted-foreground">{t.checkout.loginRequired}</p>
          <Link to="/auth" className="mt-6 inline-flex rounded-full gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow">{t.nav.login}</Link>
        </div>
      </AppShell>
    );
  }

  const subtotal = items.reduce((s, l) => s + Number(l.product?.price_sdg ?? 0) * l.qty, 0);
  const total = subtotal + (items.length ? DELIVERY_FEE_SDG : 0);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 font-display text-3xl text-foreground md:text-4xl">{t.cart.title}</h1>

        {isLoading ? (
          <div className="text-center text-muted-foreground">…</div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-display text-xl text-foreground">{t.cart.empty}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.cart.emptySub}</p>
            <Link to="/products" className="mt-6 inline-flex rounded-full gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow">{t.cart.continueShopping}</Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <ul className="space-y-3">
              {items.map((l) => {
                const p = l.product;
                const name = lang === "ar" ? p.name_ar : p.name_en;
                return (
                  <li key={p.id} className="flex gap-4 rounded-2xl border border-border bg-card p-3 shadow-glass">
                    <img src={p.image_url || "/placeholder.svg"} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
                    <div className="flex flex-1 flex-col justify-between gap-2">
                      <div>
                        <Link to="/products/$id" params={{ id: p.slug }} className="line-clamp-2 text-sm font-medium text-foreground hover:underline">{name}</Link>
                        <div className="mt-1"><PricePill price={Number(p.price_sdg)} size="sm" /></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-border">
                          <button onClick={() => setQty.mutate({ productId: p.id, qty: l.qty - 1 })} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-8 text-center text-sm font-medium">{l.qty}</span>
                          <button onClick={() => setQty.mutate({ productId: p.id, qty: l.qty + 1 })} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <button onClick={() => setQty.mutate({ productId: p.id, qty: 0 })} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />{t.cart.remove}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-glass">
              <h3 className="font-display text-lg text-foreground">{t.cart.title}</h3>
              <Row label={t.cart.subtotal} value={formatPrice(subtotal, lang)} />
              <Row label={t.cart.delivery} value={formatPrice(DELIVERY_FEE_SDG, lang)} />
              <div className="my-2 h-px bg-border" />
              <Row label={t.cart.total} value={formatPrice(total, lang)} strong />
              <Link to="/checkout" className="mt-2 block w-full rounded-full gradient-brand py-3 text-center text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95">{t.cart.checkout}</Link>
              <Link to="/products" className="block w-full rounded-full border border-border bg-card py-3 text-center text-sm font-medium text-foreground hover:bg-muted">{t.cart.continueShopping}</Link>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-display text-lg text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}
