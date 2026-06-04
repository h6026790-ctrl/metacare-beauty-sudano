import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { useI18n } from "@/i18n/I18nProvider";
import { brands, categories, products } from "@/lib/mock-data";
import type { CategoryId } from "@/lib/types";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  category: z.enum(["skincare", "makeup", "fragrance", "bodycare"]).optional(),
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

  const filtered = products.filter((p) => {
    if (search.category && p.categoryId !== search.category) return false;
    if (search.brand && p.brandId !== search.brand) return false;
    return true;
  });

  const setCategory = (id?: CategoryId) => navigate({ search: { ...search, category: id } });
  const setBrand = (id?: string) => navigate({ search: { ...search, brand: id } });

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
              <Chip key={c.id} active={search.category === c.id} onClick={() => setCategory(c.id)}>{c.name[lang]}</Chip>
            ))}
          </Chips>
          <Chips>
            <Chip active={!search.brand} onClick={() => setBrand(undefined)}>{lang === "ar" ? "كل العلامات" : "All brands"}</Chip>
            {brands.map((b) => (
              <Chip key={b.id} active={search.brand === b.id} onClick={() => setBrand(b.id)}>{b.name[lang]}</Chip>
            ))}
          </Chips>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            {t.search.noResults}
          </div>
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
