import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { useI18n } from "@/i18n/I18nProvider";
import { useProducts, useBrands, useCategories } from "@/lib/api/queries";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
});

export const Route = createFileRoute("/products")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Shop — Metacare Beauty" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const { lang, t } = useI18n();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: brands = [] } = useBrands();
  const { data: categories = [] } = useCategories();
  const { data: filtered = [], isLoading } = useProducts({ brand: search.brand, category: search.category });

  const setCategory = (slug?: string) => navigate({ search: { ...search, category: slug } });
  const setBrand = (slug?: string) => navigate({ search: { ...search, brand: slug } });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-foreground md:text-4xl">{t.nav.shop}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{lang === "ar" ? "كل منتجاتنا في مكان واحد" : "Every product, all in one place"}</p>
        </div>

        <div className="mb-4 space-y-3">
          <Chips>
            <Chip active={!search.category} onClick={() => setCategory(undefined)}>{lang === "ar" ? "كل الأقسام" : "All categories"}</Chip>
            {categories.map((c) => (
              <Chip key={c.id} active={search.category === c.slug} onClick={() => setCategory(c.slug)}>{c.name[lang]}</Chip>
            ))}
          </Chips>
          <Chips>
            <Chip active={!search.brand} onClick={() => setBrand(undefined)}>{lang === "ar" ? "كل العلامات" : "All brands"}</Chip>
            {brands.map((b) => (
              <Chip key={b.id} active={search.brand === b.slug} onClick={() => setBrand(b.slug)}>{b.name[lang]}</Chip>
            ))}
          </Chips>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">{t.search.noResults}</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Chips({ children }: { children: React.ReactNode }) {
  return <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4">{children}</div>;
}
function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition",
      active ? "border-transparent gradient-brand text-primary-foreground shadow-glow" : "border-border bg-card text-foreground hover:bg-muted",
    )}>{children}</button>
  );
}
