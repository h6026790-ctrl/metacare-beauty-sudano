import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { useI18n } from "@/i18n/I18nProvider";
import { useBrand, useProducts } from "@/lib/api/queries";

export const Route = createFileRoute("/brands/$id")({
  head: ({ params }) => ({ meta: [{ title: `${params.id} — Metacare` }] }),
  component: BrandPage,
});

function BrandPage() {
  const { id } = Route.useParams();
  const { lang } = useI18n();
  const { data: brand } = useBrand(id);
  const { data: items = [] } = useProducts({ brand: id });
  return (
    <AppShell>
      <section className="relative overflow-hidden gradient-aurora">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-12">
          <div className="grid h-20 w-20 place-items-center rounded-3xl gradient-brand font-display text-4xl text-primary-foreground shadow-glow">
            {brand?.name[lang].slice(0, 1) ?? "·"}
          </div>
          <div>
            <h1 className="font-display text-4xl text-foreground">{brand?.name[lang] ?? "—"}</h1>
            {brand?.tagline && <p className="mt-1 text-sm text-muted-foreground">{brand.tagline[lang]}</p>}
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
