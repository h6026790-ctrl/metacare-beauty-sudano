import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerOnlyNotice } from "@/components/customer/CustomerOnlyNotice";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { useCart, useSetCartQty, useToggleWishlist } from "@/lib/api/queries";
import { Minus, Plus, Trash2, ShoppingBag, Heart, MessageCircle } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { PricePill } from "@/components/PricePill";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping Cart — Metacare Beauty" },
      { name: "description", content: "Review your Metacare Beauty selections, adjust quantities and add delivery notes before checkout." },
      { property: "og:title", content: "Shopping Cart — Metacare Beauty" },
      { property: "og:description", content: "Review your Metacare Beauty selections before checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

const DELIVERY_FEE_SDG = 3000;
const NOTES_KEY = "mc.cartNotes";

function CartPage() {
  const { t, lang } = useI18n();
  const { user, isStaff } = useAuth();
  const { data, isLoading } = useCart();
  const setQty = useSetCartQty();
  const toggleWish = useToggleWishlist();
  const items = (data?.items ?? []) as any[];
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try { setNotes(window.localStorage.getItem(NOTES_KEY) ?? ""); } catch { /* noop */ }
  }, []);

  const saveNotes = (v: string) => {
    setNotes(v);
    try { window.localStorage.setItem(NOTES_KEY, v); } catch { /* noop */ }
  };

  if (isStaff) return <CustomerOnlyNotice />;
  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground">{t.cart.title}</h1>
          <p className="mt-3 text-muted-foreground">{t.checkout.loginRequired}</p>
          <Link to="/auth" className="mt-6 inline-flex min-h-[44px] items-center rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow">{t.nav.login}</Link>
        </div>
      </AppShell>
    );
  }

  const count = items.reduce((s, l) => s + l.qty, 0);
  const subtotal = items.reduce((s, l) => s + Number(l.product?.price_sdg ?? 0) * l.qty, 0);
  const total = subtotal + (items.length ? DELIVERY_FEE_SDG : 0);

  // The cart is independent from the wishlist: saving to the wishlist
  // leaves the cart line untouched.
  const saveForLater = async (productId: string) => {
    await toggleWish.mutateAsync(productId);
    toast.success(t.customer.moveToWishlist);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <h1 className="font-display text-3xl text-foreground md:text-4xl">{t.cart.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.customer.itemsCount}: {count}
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-display text-xl text-foreground">{t.cart.empty}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.cart.emptySub}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/products" className="inline-flex min-h-[44px] items-center rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow">{t.cart.continueShopping}</Link>
              <Link to="/account/wishlist" className="inline-flex min-h-[44px] items-center rounded-full border border-border px-6 text-sm font-medium text-foreground hover:bg-muted">{t.nav.wishlist}</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <ul className="space-y-3">
                {items.map((l) => {
                  const p = l.product;
                  const name = lang === "ar" ? p.name_ar : p.name_en;
                  return (
                    <li key={p.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-2xl border border-border bg-card p-3 shadow-glass">
                      <Link to="/products/$id" params={{ id: p.slug }} className="shrink-0">
                        <img src={p.image_url || "/placeholder.svg"} alt={name} loading="lazy" className="h-24 w-24 rounded-xl object-cover" />
                      </Link>
                      <div className="flex min-w-0 flex-col justify-between gap-2">
                        <div className="min-w-0">
                          <Link to="/products/$id" params={{ id: p.slug }} className="line-clamp-2 text-sm font-medium text-foreground hover:underline">{name}</Link>
                          <div className="mt-1"><PricePill price={Number(p.price_sdg)} size="sm" /></div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="inline-flex items-center rounded-full border border-border">
                            <button aria-label="-" onClick={() => setQty.mutate({ productId: p.id, qty: l.qty - 1 })} className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted"><Minus className="h-3.5 w-3.5" /></button>
                            <span className="w-8 text-center text-sm font-medium">{l.qty}</span>
                            <button aria-label="+" onClick={() => setQty.mutate({ productId: p.id, qty: l.qty + 1 })} className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted"><Plus className="h-3.5 w-3.5" /></button>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => saveForLater(p.id)} className="inline-flex min-h-[36px] items-center gap-1 text-xs text-muted-foreground hover:text-violet">
                              <Heart className="h-3.5 w-3.5" />{t.customer.moveToWishlist}
                            </button>
                            <button onClick={() => setQty.mutate({ productId: p.id, qty: 0 })} className="inline-flex min-h-[36px] items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />{t.cart.remove}
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
                <h3 className="mb-2 font-display text-lg text-foreground">{t.customer.orderNotes}</h3>
                <Textarea rows={3} value={notes} onChange={(e) => saveNotes(e.target.value)} placeholder={t.customer.orderNotesPh} />
              </div>
            </div>

            <aside className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-glass lg:sticky lg:top-24 lg:self-start">
              <h3 className="font-display text-lg text-foreground">{t.cart.title}</h3>
              <Row label={`${t.customer.itemsCount} (${count})`} value={formatPrice(subtotal, lang)} />
              <Row label={t.cart.delivery} value={formatPrice(DELIVERY_FEE_SDG, lang)} />
              <div className="my-2 h-px bg-border" />
              <Row label={t.cart.total} value={formatPrice(total, lang)} strong />
              <Link to="/checkout" className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-full gradient-brand text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95">{t.cart.checkout}</Link>
              <Link to="/products" className="flex min-h-[48px] w-full items-center justify-center rounded-full border border-border bg-card text-sm font-medium text-foreground hover:bg-muted">{t.cart.continueShopping}</Link>
              <Link to="/support" className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground hover:text-foreground">
                <MessageCircle className="h-3.5 w-3.5" />{t.customer.needHelp}
              </Link>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>
      <span className={strong ? "font-display text-lg text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}
