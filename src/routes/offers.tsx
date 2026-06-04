import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { useI18n } from "@/i18n/I18nProvider";
import { onSaleProducts } from "@/lib/mock-data";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Offers — Metacare Beauty" },
      { name: "description", content: "Limited-time offers on premium beauty products in Wad Madani." },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { lang, t } = useI18n();
  const items = onSaleProducts();
  return (
    <AppShell>
      <section className="relative overflow-hidden gradient-hero">
        <div className="mx-auto max-w-7xl px-4 py-14 text-primary-foreground">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {lang === "ar" ? "عروض الأسبوع" : "This week"}
          </span>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">{t.home.featured}</h1>
          <p className="mt-2 max-w-xl text-sm opacity-90 md:text-base">
            {lang === "ar"
              ? "أسعار مخفّضة لفترة محدودة على مجموعة مختارة من منتجاتنا الفاخرة."
              : "Limited-time prices on a curated selection of our premium products."}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <p className="font-display text-xl text-foreground">{lang === "ar" ? "لا توجد عروض حالياً" : "No offers right now"}</p>
            <Link to="/products" className="mt-6 inline-flex rounded-full gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow">
              {t.cart.continueShopping}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
