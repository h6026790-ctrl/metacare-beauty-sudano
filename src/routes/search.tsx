import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { useI18n } from "@/i18n/I18nProvider";
import { useSearchProducts } from "@/lib/api/queries";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRecentSearches } from "@/lib/customer-local";
import { X } from "lucide-react";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({ meta: [{ title: "Search — Metacare" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { lang, t } = useI18n();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");
  useEffect(() => { setQ(search.q ?? ""); }, [search.q]);
  const { data: results = [] } = useSearchProducts(search.q ?? "");
  const { searches, record, remove, clear } = useRecentSearches();

  useEffect(() => { if (search.q) record(search.q); }, [search.q, record]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-5 font-display text-3xl text-foreground">{t.search.results}</h1>
        <form onSubmit={(e) => { e.preventDefault(); navigate({ search: { q: q.trim() || undefined } }); }} className="relative max-w-xl">
          <SearchIcon className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" style={{ insetInlineStart: "1rem" }} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search.placeholder} className="h-12 rounded-full bg-card ps-11 pe-4 text-sm shadow-glass" />
        </form>
        {searches.length > 0 && (
          <section className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.customer.recentSearches}</h2>
              <button onClick={clear} className="text-xs text-muted-foreground hover:text-foreground">{t.customer.clear}</button>
            </div>
            <ul className="flex flex-wrap gap-2">
              {searches.map((s) => (
                <li key={s} className="inline-flex items-center gap-1 rounded-full border border-border bg-card ps-3 pe-1 text-xs text-foreground">
                  <button className="min-h-[36px]" onClick={() => { setQ(s); navigate({ search: { q: s } }); }}>{s}</button>
                  <button aria-label="remove" onClick={() => remove((x) => x === s)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-muted">
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8">
          {!search.q ? (
            <p className="text-sm text-muted-foreground">{lang === "ar" ? "اكتبي اسم المنتج أو العلامة" : "Type a product, brand or category"}</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.search.noResults}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {results.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
