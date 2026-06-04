import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { useI18n } from "@/i18n/I18nProvider";
import { findBrand, productsByBrand } from "@/lib/mock-data";

export const Route = createFileRoute("/brands/$id")({
  loader: ({ params }) => {
    const brand = findBrand(params.id);
    if (!brand) throw notFound();
    return { brand };
  },
  notFoundComponent: () => <AppShell><div className="p-10 text-center text-muted-foreground">Brand not found.</div></AppShell>,
  head: ({ loaderData }) => ({ meta: [{ title: loaderData ? `${loaderData.brand.name.en} — Metacare` : "Brand" }] }),
  component: BrandPage,
});

function BrandPage() {
  const { brand } = Route.useLoaderData();
  const { lang } = useI18n();
  const items = productsByBrand(brand.id);
  return (
    <AppShell>
      <section className="relative overflow-hidden gradient-aurora">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-12">
          <div className="grid h-20 w-20 place-items-center rounded-3xl gradient-brand font-display text-4xl text-primary-foreground shadow-glow">
            {brand.name[lang].slice(0, 1)}
          </div>
          <div>
            <h1 className="font-display text-4xl text-foreground">{brand.name[lang]}</h1>
            {brand.tagline && <p className="mt-1 text-sm text-muted-foreground">{brand.tagline[lang]}</p>}
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </div>
    </AppShell>
  );
}
