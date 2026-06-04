import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { findBrand, findCategory, findProduct, products } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { PricePill } from "@/components/PricePill";
import { ProductCard } from "@/components/ProductCard";
import { Heart, ShieldCheck, Truck, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/$id")({
  loader: ({ params }) => {
    const product = findProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.product.name.en} — Metacare` : "Product" }],
  }),
  notFoundComponent: () => <AppShell><div className="p-10 text-center text-muted-foreground">Product not found.</div></AppShell>,
  component: ProductDetail,
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const { lang, t } = useI18n();
  const addToCart = useStore((s) => s.addToCart);
  const wishlist = useStore((s) => s.wishlist);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const isWished = wishlist.includes(product.id);
  const brand = findBrand(product.brandId);
  const cat = findCategory(product.categoryId);
  const related = products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);
  const oos = product.stock <= 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <nav className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">{t.nav.home}</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-foreground">{t.nav.shop}</Link>
          {cat && <><span>/</span><Link to="/products" search={{ category: cat.id }} className="hover:text-foreground">{cat.name[lang]}</Link></>}
        </nav>

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <div className="relative aspect-square overflow-hidden rounded-3xl gradient-aurora shadow-glass">
            <img src={product.image} alt={product.name[lang]} className={cn("h-full w-full object-cover", oos && "opacity-60 grayscale")} />
            {oos && (
              <div className="absolute inset-x-0 bottom-0 bg-background/90 px-4 py-3 text-center text-sm font-medium text-foreground backdrop-blur">
                {t.product.outOfStock}
              </div>
            )}
          </div>

          <div className="space-y-5">
            {brand && (
              <Link to="/brands/$id" params={{ id: brand.id }} className="inline-flex text-xs uppercase tracking-[0.2em] text-primary hover:underline">
                {brand.name[lang]}
              </Link>
            )}
            <h1 className="font-display text-3xl text-foreground md:text-4xl">{product.name[lang]}</h1>
            <PricePill price={product.price} compareAt={product.compareAt} size="lg" />

            <p className="text-base leading-relaxed text-muted-foreground">{product.description[lang]}</p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                disabled={oos}
                onClick={() => { addToCart(product.id); toast.success(t.product.added); }}
                className={cn(
                  "inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-medium transition",
                  oos
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : "gradient-brand text-primary-foreground shadow-glow hover:opacity-95"
                )}
              >
                {oos ? t.product.outOfStock : t.product.addToCart}
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={cn(
                  "inline-flex h-12 items-center gap-2 rounded-full border px-5 text-sm font-medium transition",
                  isWished ? "border-violet bg-violet/10 text-violet" : "border-border bg-card text-foreground hover:bg-muted"
                )}
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

            <div className="mt-6 space-y-3">
              <h3 className="font-display text-lg text-foreground">{t.product.specs}</h3>
              <dl className="divide-y divide-border rounded-2xl border border-border bg-card text-sm">
                {product.specs.map((s: typeof product.specs[number], i: number) => (
                  <div key={i} className="grid grid-cols-2 gap-2 px-4 py-3">
                    <dt className="text-muted-foreground">{s.label[lang]}</dt>
                    <dd className="text-foreground">{s.value[lang]}</dd>
                  </div>
                ))}
                {cat && (
                  <div className="grid grid-cols-2 gap-2 px-4 py-3">
                    <dt className="text-muted-foreground">{t.product.category}</dt>
                    <dd className="text-foreground">{cat.name[lang]}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-5 font-display text-2xl text-foreground">{t.product.related}</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
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
