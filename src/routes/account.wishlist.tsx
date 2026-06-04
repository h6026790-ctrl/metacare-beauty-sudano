import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";
import { findProduct } from "@/lib/mock-data";

export const Route = createFileRoute("/account/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Metacare" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { t, lang } = useI18n();
  const wishlist = useStore((s) => s.wishlist);
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="mb-6 font-display text-3xl text-foreground md:text-4xl">{t.nav.wishlist}</h1>
        {wishlist.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <p className="font-display text-xl text-foreground">{t.account.noWishlist}</p>
            <Link to="/products" className="mt-6 inline-flex rounded-full gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow">{lang === "ar" ? "تصفّحي المنتجات" : "Browse products"}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {wishlist.map((id, i) => {
              const p = findProduct(id);
              return p ? <ProductCard key={id} product={p} index={i} /> : null;
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
