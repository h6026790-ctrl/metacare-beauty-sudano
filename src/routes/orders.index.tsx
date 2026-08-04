import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerOnlyNotice } from "@/components/customer/CustomerOnlyNotice";
import { z } from "zod";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { useMyOrders, useAddToCart } from "@/lib/api/queries";
import { OrderRow } from "@/components/customer/OrderRow";
import { Input } from "@/components/ui/input";
import { Package, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FILTERS = ["all", "active", "completed", "cancelled"] as const;
type Filter = (typeof FILTERS)[number];

export const Route = createFileRoute("/orders/")({
  validateSearch: z.object({ tab: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "My Orders — Metacare Beauty" },
      { name: "description", content: "Track every Metacare Beauty order, review past purchases and reorder your favourites." },
      { property: "og:title", content: "My Orders — Metacare Beauty" },
      { property: "og:description", content: "Track every Metacare Beauty order and reorder your favourites." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersCenter,
});

function OrdersCenter() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useMyOrders();
  const addToCart = useAddToCart();
  const [q, setQ] = useState("");
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const filter = (FILTERS.includes(search.tab as Filter) ? search.tab : "all") as Filter;

  const visible = useMemo(() => {
    const byTab = (orders as any[]).filter((o) => {
      if (filter === "active") return !["delivered", "cancelled", "returned"].includes(o.status);
      if (filter === "completed") return ["delivered", "returned"].includes(o.status);
      if (filter === "cancelled") return o.status === "cancelled";
      return true;
    });
    const term = q.trim().toLowerCase();
    return term ? byTab.filter((o) => String(o.number).toLowerCase().includes(term)) : byTab;
  }, [orders, filter, q]);

  const reorder = async (order: any) => {
    const ids = (order.order_items ?? []).map((i: any) => i.product_id).filter(Boolean);
    if (!ids.length) return;
    for (const id of ids) {
      try { await addToCart.mutateAsync(id); } catch { /* skip unavailable product */ }
    }
    toast.success(t.customer.reordered);
  };

  if (!user) return <SignedOut />;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-6">
          <h1 className="font-display text-3xl text-foreground md:text-4xl">{t.customer.ordersCenter}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.customer.dashboardSub}</p>
        </header>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" style={{ insetInlineStart: "1rem" }} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.customer.ordersSearch} className="h-12 rounded-full bg-card ps-11 pe-4 text-sm shadow-glass" />
        </div>

        <div className="scrollbar-hide -mx-4 mb-5 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => navigate({ search: { tab: f === "all" ? undefined : f } })}
              className={cn(
                "min-h-[40px] shrink-0 rounded-full border px-4 text-xs font-medium transition",
                filter === f ? "border-transparent gradient-brand text-primary-foreground shadow-glow" : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {t.customer[`filter${f[0].toUpperCase()}${f.slice(1)}` as keyof typeof t.customer]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-display text-xl text-foreground">{t.account.noOrders}</p>
            <Link to="/products" className="mt-6 inline-flex min-h-[44px] items-center rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow">
              {t.customer.continueShopping}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((o: any) => (
              <li key={o.id}><OrderRow order={o} onReorder={reorder} /></li>
            ))}
          </ul>
        )}

        <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-center shadow-glass">
          <p className="text-sm font-medium text-foreground">{t.customer.needHelp}</p>
          <Link to="/support" className="mt-3 inline-flex min-h-[44px] items-center rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-muted">
            {t.customer.contactSupport}
          </Link>
        </div>
      </div>
    </AppShell>
  );

  function SignedOut() {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground">{t.customer.ordersCenter}</h1>
          <p className="mt-3 text-muted-foreground">{lang === "ar" ? "يرجى تسجيل الدخول أولاً" : "Please sign in first"}</p>
          <Link to="/auth" className="mt-6 inline-flex min-h-[44px] items-center rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow">{t.nav.login}</Link>
        </div>
      </AppShell>
    );
  }
}
