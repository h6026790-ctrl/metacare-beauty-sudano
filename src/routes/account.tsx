import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { findProduct } from "@/lib/mock-data";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import { formatDate, formatPrice } from "@/lib/format";
import { LogOut, User as UserIcon, Heart, Package, Globe } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — Metacare" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { t, lang, setLang } = useI18n();
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const orders = useStore((s) => s.orders);
  const wishlist = useStore((s) => s.wishlist);
  const navigate = useNavigate();

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground">{t.nav.account}</h1>
          <p className="mt-3 text-muted-foreground">{lang === "ar" ? "يرجى تسجيل الدخول أولاً" : "Please sign in first"}</p>
          <Link to="/auth" className="mt-6 inline-flex rounded-full gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow">{t.nav.login}</Link>
        </div>
      </AppShell>
    );
  }

  const activeOrders = orders.filter((o) => o.status !== "cancelled" && o.status !== "delivered" && o.status !== "returned");
  const pastOrders = orders.filter((o) => o.status === "delivered" || o.status === "returned");

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Hero */}
        <div className="mb-6 overflow-hidden rounded-3xl gradient-hero p-8 text-primary-foreground shadow-elevated">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-foreground/15">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] opacity-80">{t.nav.account}</p>
                <h1 className="font-display text-3xl">{user.name}</h1>
                <p className="mt-0.5 text-sm opacity-90" dir="ltr">{user.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2 text-xs font-medium backdrop-blur hover:bg-primary-foreground/25">
                <Globe className="h-3.5 w-3.5" />
                {lang === "ar" ? "English" : "العربية"}
              </button>
              <button onClick={() => { logout(); navigate({ to: "/" }); }} className="inline-flex items-center gap-2 rounded-full bg-destructive/90 px-4 py-2 text-xs font-medium text-destructive-foreground hover:bg-destructive">
                <LogOut className="h-3.5 w-3.5" />
                {t.account.logout}
              </button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="orders" className="space-y-5">
          <TabsList className="rounded-full bg-card p-1 shadow-glass">
            <TabsTrigger value="orders" className="gap-2 rounded-full data-[state=active]:gradient-brand data-[state=active]:text-primary-foreground">
              <Package className="h-3.5 w-3.5" />{t.account.orders}
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="gap-2 rounded-full data-[state=active]:gradient-brand data-[state=active]:text-primary-foreground">
              <Heart className="h-3.5 w-3.5" />{t.account.wishlist}
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 rounded-full data-[state=active]:gradient-brand data-[state=active]:text-primary-foreground">
              <UserIcon className="h-3.5 w-3.5" />{t.account.profile}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <Section title={t.account.activeOrders}>
              {activeOrders.length === 0
                ? <Empty text={t.account.noOrders} />
                : <OrderList orders={activeOrders} />}
            </Section>
            <Section title={t.account.orderHistory}>
              {pastOrders.length === 0
                ? <Empty text={t.account.noOrders} />
                : <OrderList orders={pastOrders} />}
            </Section>
          </TabsContent>

          <TabsContent value="wishlist">
            {wishlist.length === 0 ? (
              <Empty text={t.account.noWishlist} />
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                {wishlist.map((id, i) => {
                  const p = findProduct(id);
                  return p ? <ProductCard key={id} product={p} index={i} /> : null;
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-glass">
              <h3 className="mb-4 font-display text-lg text-foreground">{t.account.profile}</h3>
              <dl className="divide-y divide-border text-sm">
                <Row label={t.checkout.fullName} value={user.name} />
                <Row label={t.checkout.phone} value={user.phone} ltr />
                <Row label={t.checkout.whatsapp} value={user.whatsapp} ltr />
              </dl>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 font-display text-xl text-foreground">{title}</h3>
      {children}
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{text}</div>;
}
function OrderList({ orders }: { orders: ReturnType<typeof useStore.getState>["orders"] }) {
  const { lang, t } = useI18n();
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id}>
          <Link to="/orders/$id" params={{ id: o.id }} search={{}} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-glass transition hover:shadow-elevated">
            <div>
              <p className="font-mono text-sm font-medium tracking-wider text-foreground">{o.number}</p>
              <p className="text-xs text-muted-foreground">{formatDate(o.createdAt, lang)} • {o.items.length} {t.cart.item}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">{formatPrice(o.total, lang)}</span>
              <OrderStatusBadge status={o.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground" dir={ltr ? "ltr" : undefined}>{value}</span>
    </div>
  );
}
