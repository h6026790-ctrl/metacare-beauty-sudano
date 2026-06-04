import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { categories, productsByCategory } from "@/lib/mock-data";

export const Route = createFileRoute("/categories")({
  head: () => ({ meta: [{ title: "Categories — Metacare" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { lang, t } = useI18n();
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="mb-6 font-display text-3xl text-foreground md:text-4xl">{t.nav.categories}</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((c) => {
            const count = productsByCategory(c.id).length;
            return (
              <Link
                key={c.id}
                to="/products"
                search={{ category: c.id }}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-glass transition hover:-translate-y-1 hover:shadow-elevated"
              >
                <span className="absolute -end-10 -top-10 text-[10rem] text-accent/15 transition group-hover:text-accent/30">{c.icon}</span>
                <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{lang === "ar" ? "قسم" : "Category"}</p>
                <h2 className="mt-2 font-display text-3xl text-foreground">{c.name[lang]}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{count} {lang === "ar" ? "منتجاً" : "products"}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
