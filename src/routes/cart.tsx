import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore, DELIVERY_FEE_SDG } from "@/lib/store";
import { findProduct } from "@/lib/mock-data";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { PricePill } from "@/components/PricePill";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Metacare" }] }),
  component: CartPage,
});

function CartPage() {
  const { t, lang } = useI18n();
  const cart = useStore((s) => s.cart);
  const setQty = useStore((s) => s.setQty);
  const remove = useStore((s) => s.removeFromCart);
  const user = useStore((s) => s.user);

  const lines = cart.map((c) => ({ ...c, product: findProduct(c.productId)! })).filter((l) => l.product);
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const total = subtotal + (lines.length ? DELIVERY_FEE_SDG : 0);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 font-display text-3xl text-foreground md:text-4xl">{t.cart.title}</h1>

        {lines.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-display text-xl text-foreground">{t.cart.empty}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.cart.emptySub}</p>
            <Link to="/products" className="mt-6 inline-flex rounded-full gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow">{t.cart.continueShopping}</Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <ul className="space-y-3">
              {lines.map((l) => (
                <li key={l.productId} className="flex gap-4 rounded-2xl border border-border bg-card p-3 shadow-glass">
                  <img src={l.product.image} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
                  <div className="flex flex-1 flex-col justify-between gap-2">
                    <div>
                      <Link to="/products/$id" params={{ id: l.product.id }} className="line-clamp-2 text-sm font-medium text-foreground hover:underline">{l.product.name[lang]}</Link>
                      <div className="mt-1"><PricePill price={l.product.price} size="sm" /></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button onClick={() => setQty(l.productId, l.qty - 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center text-sm font-medium">{l.qty}</span>
                        <button onClick={() => setQty(l.productId, l.qty + 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <button onClick={() => remove(l.productId)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                        {t.cart.remove}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-glass">
              <h3 className="font-display text-lg text-foreground">{t.cart.title}</h3>
              <Row label={t.cart.subtotal} value={user ? formatPrice(subtotal, lang) : "—"} />
              <Row label={t.cart.delivery} value={user ? formatPrice(DELIVERY_FEE_SDG, lang) : "—"} />
              <div className="my-2 h-px bg-border" />
              <Row label={t.cart.total} value={user ? formatPrice(total, lang) : "—"} strong />
              {!user && <p className="text-xs text-muted-foreground">{t.product.loginToSee}</p>}
              <Link
                to="/checkout"
                className="mt-2 block w-full rounded-full gradient-brand py-3 text-center text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95"
              >
                {t.cart.checkout}
              </Link>
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
