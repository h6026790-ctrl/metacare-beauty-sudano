import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { brands, productsByBrand } from "@/lib/mock-data";

export const Route = createFileRoute("/brands")({
  head: () => ({ meta: [{ title: "Brands — Metacare" }] }),
  component: BrandsPage,
});

function BrandsPage() {
  const { lang, t } = useI18n();
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="mb-6 font-display text-3xl text-foreground md:text-4xl">{t.nav.brands}</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => (
            <Link
              key={b.id}
              to="/brands/$id"
              params={{ id: b.id }}
              className="group rounded-2xl border border-border bg-card p-6 shadow-glass transition hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-brand font-display text-2xl text-primary-foreground shadow-glow">
                  {b.name[lang].slice(0, 1)}
                </div>
                <div>
                  <h2 className="font-display text-xl text-foreground">{b.name[lang]}</h2>
                  {b.tagline && <p className="text-xs text-muted-foreground">{b.tagline[lang]}</p>}
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {productsByBrand(b.id).length} {lang === "ar" ? "منتجاً" : "products"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
