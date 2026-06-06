import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { useProduct, useProducts, useAddToCart, useToggleWishlist, useWishlist } from "@/lib/api/queries";
import { PricePill } from "@/components/PricePill";
import { ProductCard } from "@/components/ProductCard";
import { Heart, ShieldCheck, Truck, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/$id")({
  head: ({ params }) => ({ meta: [{ title: `${params.id} — Metacare` }] }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const { data: product, isLoading } = useProduct(id);
  const { data: related = [] } = useProducts();
  const { data: wishlist } = useWishlist();
  const addToCart = useAddToCart();
  const toggleWish = useToggleWishlist();

  if (isLoading) {
    return <AppShell><div className="mx-auto max-w-7xl p-10 text-center text-muted-foreground">…</div></AppShell>;
  }
  if (!product) {
    return <AppShell><div className="p-16 text-center text-muted-foreground">{lang === "ar" ? "المنتج غير موجود" : "Product not found"}</div></AppShell>;
  }
  const isWished = !!wishlist?.some((w: any) => w.product?.id === product.id);
  const oos = !product.inStock;
  const relatedItems = related.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);

  const requireAuth = () => { if (!user) { window.location.href = "/auth"; return false; } return true; };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <nav className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">{t.nav.home}</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-foreground">{t.nav.shop}</Link>
        </nav>

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <div className="relative aspect-square overflow-hidden rounded-3xl gradient-aurora shadow-glass">
            <img src={product.image} alt={product.name[lang]} className={cn("h-full w-full object-cover", oos && "opacity-60 grayscale")} />
            {oos && (
              <div className="absolute inset-x-0 bottom-0 bg-background/90 px-4 py-3 text-center text-sm font-medium text-foreground backdrop-blur">{t.product.outOfStock}</div>
            )}
          </div>

          <div className="space-y-5">
            {product.brand && (
              <Link to="/brands/$id" params={{ id: product.brand.slug }} className="inline-flex text-xs uppercase tracking-[0.2em] text-primary hover:underline">
                {product.brand.name[lang]}
              </Link>
            )}
            <h1 className="font-display text-3xl text-foreground md:text-4xl">{product.name[lang]}</h1>
            <PricePill price={product.price} compareAt={product.compareAt} size="lg" />
            <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium", oos ? "bg-destructive/10 text-destructive" : "bg-success/15 text-success")}>
              {oos ? t.product.outOfStock : t.product.inStock}
            </span>
            <p className="text-base leading-relaxed text-muted-foreground">{product.description[lang]}</p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                disabled={oos}
                onClick={() => { if (!requireAuth()) return; addToCart.mutate(product.id, { onSuccess: () => toast.success(t.product.added) }); }}
                className={cn("inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-medium transition",
                  oos ? "cursor-not-allowed bg-muted text-muted-foreground"
                      : "gradient-brand text-primary-foreground shadow-glow hover:opacity-95")}
              >
                {oos ? t.product.outOfStock : t.product.addToCart}
              </button>
              <button
                onClick={() => { if (!requireAuth()) return; toggleWish.mutate(product.id); }}
                className={cn("inline-flex h-12 items-center gap-2 rounded-full border px-5 text-sm font-medium transition",
                  isWished ? "border-violet bg-violet/10 text-violet" : "border-border bg-card text-foreground hover:bg-muted")}
              >
                <Heart className={cn("h-4 w-4", isWished && "fill-current")} />
                {isWished ? t.product.removeFromWishlist : t.product.addToWishlist}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-3 text-center text-xs">
              <Trust icon={ShieldCheck} label={t.home.trust1Title} />
              <Trust icon={Truck} label={t.home.trust2Title} />
              <Trust icon={MessageCircle} label={t.home.trust3Title} />
            </div>
          </div>
        </div>

        {relatedItems.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-5 font-display text-2xl text-foreground">{t.product.related}</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {relatedItems.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Trust({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-1 text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" />
      <span>{label}</span>
    </div>
  );
}
