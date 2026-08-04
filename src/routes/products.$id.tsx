import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { useProduct, useProducts, useAddToCart, useToggleWishlist, useWishlist } from "@/lib/api/queries";
import { PricePill } from "@/components/PricePill";
import { ProductCard } from "@/components/ProductCard";
import { Heart, ShieldCheck, Truck, MessageCircle, Share2, Lock, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useRecentlyViewed } from "@/lib/customer-local";

export const Route = createFileRoute("/products/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Metacare` },
      { property: "og:url", content: `https://metacare-beauty-sudano.lovable.app/products/${params.id}` },
    ],
    links: [{ rel: "canonical", href: `https://metacare-beauty-sudano.lovable.app/products/${params.id}` }],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id);
  const { data: related = [] } = useProducts();
  const { data: wishlist } = useWishlist();
  const addToCart = useAddToCart();
  const toggleWish = useToggleWishlist();
  const { record } = useRecentlyViewed();

  useEffect(() => { if (product?.slug) record(product.slug); }, [product?.slug, record]);

  if (isLoading) {
    return <AppShell><div className="mx-auto max-w-7xl p-10 text-center text-muted-foreground">…</div></AppShell>;
  }
  if (!product) {
    return <AppShell><div className="p-16 text-center text-muted-foreground">{lang === "ar" ? "المنتج غير موجود" : "Product not found"}</div></AppShell>;
  }
  const isWished = !!wishlist?.some((w: any) => w.product?.id === product.id);
  const oos = !product.inStock;
  const relatedItems = related.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: product.name[lang], url }); return; } catch { /* fallthrough */ }
    }
    try { await navigator.clipboard.writeText(url); toast.success(t.visitor.linkCopied); } catch { /* noop */ }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 pb-28 md:py-10 md:pb-10">
        <nav className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">{t.nav.home}</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-foreground">{t.nav.shop}</Link>
        </nav>

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <div className="relative aspect-square overflow-hidden rounded-3xl gradient-aurora shadow-glass">
            <img src={product.image} alt={product.name[lang]} className={cn("h-full w-full object-cover", oos && user && "opacity-60 grayscale")} />
            {oos && user && (
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
            {user && (
              <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium", oos ? "bg-destructive/10 text-destructive" : "bg-success/15 text-success")}>
                {oos ? t.product.outOfStock : t.product.inStock}
              </span>
            )}
            <p className="text-base leading-relaxed text-muted-foreground">{product.description[lang]}</p>

            {user ? (
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  disabled={oos}
                  onClick={() => addToCart.mutate(product.id, { onSuccess: () => toast.success(t.product.added) })}
                  className={cn("inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-medium transition",
                    oos ? "cursor-not-allowed bg-muted text-muted-foreground"
                        : "gradient-brand text-primary-foreground shadow-glow hover:opacity-95")}
                >
                  {oos ? t.product.outOfStock : t.product.addToCart}
                </button>
                <button
                  onClick={() => toggleWish.mutate(product.id)}
                  className={cn("inline-flex h-12 items-center gap-2 rounded-full border px-5 text-sm font-medium transition",
                    isWished ? "border-violet bg-violet/10 text-violet" : "border-border bg-card text-foreground hover:bg-muted")}
                >
                  <Heart className={cn("h-4 w-4", isWished && "fill-current")} />
                  {isWished ? t.product.removeFromWishlist : t.product.addToWishlist}
                </button>
                <button onClick={handleShare} className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-muted">
                  <Share2 className="h-4 w-4" />
                  {t.visitor.shareProduct}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-5">
                <div className="flex items-start gap-3">
                  <Lock className="mt-1 h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-display text-lg text-foreground">{t.product.loginToSee}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t.visitor.registerBanner}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link to="/auth" className="inline-flex h-11 items-center gap-2 rounded-full gradient-brand px-5 text-sm font-medium text-primary-foreground shadow-glow">
                        <UserPlus className="h-4 w-4" />
                        {t.visitor.registerCta}
                      </Link>
                      <Link to="/auth" className="inline-flex h-11 items-center rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-muted">
                        {t.nav.login}
                      </Link>
                      <button onClick={handleShare} className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-muted">
                        <Share2 className="h-4 w-4" />
                        {t.visitor.shareProduct}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

      {!user && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur md:hidden" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
          <button
            onClick={() => navigate({ to: "/auth" })}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full gradient-brand text-sm font-medium text-primary-foreground shadow-glow"
          >
            <UserPlus className="h-4 w-4" />
            {t.visitor.registerCta}
          </button>
        </div>
      )}
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
