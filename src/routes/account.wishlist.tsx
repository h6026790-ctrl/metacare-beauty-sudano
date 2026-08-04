import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist, useToggleWishlist, useAddToCart } from "@/lib/api/queries";
import { PricePill } from "@/components/PricePill";
import { Input } from "@/components/ui/input";
import { Heart, Search, ShoppingBag, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/wishlist")({
  head: () => ({
    meta: [
      { title: "My Wishlist — Metacare Beauty" },
      { name: "description", content: "Everything you saved at Metacare Beauty — move items to your cart whenever you are ready." },
      { property: "og:title", content: "My Wishlist — Metacare Beauty" },
      { property: "og:description", content: "Everything you saved at Metacare Beauty, ready to move to your cart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { data: wishlist = [], isLoading } = useWishlist();
  const toggleWish = useToggleWishlist();
  const addToCart = useAddToCart();
  const [q, setQ] = useState("");

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground">{t.customer.wishlistCenter}</h1>
          <p className="mt-3 text-muted-foreground">{lang === "ar" ? "يرجى تسجيل الدخول أولاً" : "Please sign in first"}</p>
          <Link to="/auth" className="mt-6 inline-flex min-h-[44px] items-center rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow">{t.nav.login}</Link>
        </div>
      </AppShell>
    );
  }

  const term = q.trim().toLowerCase();
  const items = (wishlist as any[])
    .map((w) => w.product)
    .filter(Boolean)
    .filter((p) => !term || `${p.name_ar} ${p.name_en}`.toLowerCase().includes(term));

  const stockOf = (p: any) => (Array.isArray(p.inventory) ? p.inventory[0]?.stock ?? 0 : p.inventory?.stock ?? 0);

  const moveToCart = async (p: any) => {
    await addToCart.mutateAsync(p.id);
    await toggleWish.mutateAsync(p.id);
    toast.success(t.product.added);
  };

  const moveAll = async () => {
    for (const p of items.filter((p) => stockOf(p) > 0)) {
      try { await addToCart.mutateAsync(p.id); await toggleWish.mutateAsync(p.id); } catch { /* skip */ }
    }
    toast.success(t.product.added);
  };

  const share = async () => {
    const url = `${window.location.origin}/products`;
    if (navigator.share) {
      try { await navigator.share({ title: t.customer.wishlistCenter, url }); return; } catch { /* fallthrough */ }
    }
    try { await navigator.clipboard.writeText(url); toast.success(t.visitor.linkCopied); } catch { /* noop */ }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl text-foreground">{t.customer.wishlistCenter}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t.customer.wishlistSub}</p>
          </div>
          <button onClick={share} className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground hover:bg-muted">
            <Share2 className="h-3.5 w-3.5" />{t.customer.shareWishlist}
          </button>
        </header>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : (wishlist as any[]).length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-display text-xl text-foreground">{t.account.noWishlist}</p>
            <Link to="/products" className="mt-6 inline-flex min-h-[44px] items-center rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow">
              {t.customer.continueShopping}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" style={{ insetInlineStart: "1rem" }} />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search.placeholder} className="h-12 rounded-full bg-card ps-11 pe-4 text-sm shadow-glass" />
              </div>
              <button onClick={moveAll} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full gradient-brand px-5 text-sm font-medium text-primary-foreground shadow-glow">
                <ShoppingBag className="h-4 w-4" />{t.customer.moveAllToCart}
              </button>
            </div>

            <ul className="space-y-3">
              {items.map((p: any) => {
                const oos = stockOf(p) <= 0;
                return (
                  <li key={p.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-2xl border border-border bg-card p-3 shadow-glass">
                    <Link to="/products/$id" params={{ id: p.slug }} className="shrink-0">
                      <img src={p.image_url || "/placeholder.svg"} alt={lang === "ar" ? p.name_ar : p.name_en} className="h-24 w-24 rounded-xl object-cover" loading="lazy" />
                    </Link>
                    <div className="flex min-w-0 flex-col justify-between gap-2">
                      <div className="min-w-0">
                        <Link to="/products/$id" params={{ id: p.slug }} className="line-clamp-2 text-sm font-medium text-foreground hover:underline">
                          {lang === "ar" ? p.name_ar : p.name_en}
                        </Link>
                        <div className="mt-1 flex items-center gap-2">
                          <PricePill price={Number(p.price_sdg)} size="sm" />
                          {oos && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">{t.product.outOfStock}</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          disabled={oos}
                          onClick={() => moveToCart(p)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />{t.customer.moveToCart}
                        </button>
                        <button
                          onClick={() => toggleWish.mutate(p.id)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-border px-4 text-xs font-medium text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />{t.customer.removeFromWishlist}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </AppShell>
  );
}
