import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CustomerOnlyNotice } from "@/components/customer/CustomerOnlyNotice";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import {
  useMyOrders, useMyProfile, useUpdateProfile, useUpsertAddress, useStatesTree,
  useWishlist, useProducts, useCart,
} from "@/lib/api/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { OrderRow } from "@/components/customer/OrderRow";
import { formatPrice } from "@/lib/format";
import { useRecentlyViewed } from "@/lib/customer-local";
import {
  LogOut, User as UserIcon, Heart, Package, Globe, ShoppingBag, Bell, LifeBuoy,
  MapPin, ShieldCheck, LayoutGrid,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "My Space — Metacare Beauty" },
      { name: "description", content: "Your Metacare Beauty workspace: orders, wishlist, addresses and account settings." },
      { property: "og:title", content: "My Space — Metacare Beauty" },
      { property: "og:description", content: "Your Metacare Beauty workspace: orders, wishlist and account settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const { data: profileData } = useMyProfile();
  const { data: orders = [] } = useMyOrders();
  const { data: wishlist = [] } = useWishlist();
  const { data: cart } = useCart();
  const { data: states = [] } = useStatesTree();
  const { data: allProducts = [] } = useProducts();
  const { viewed, clear: clearViewed } = useRecentlyViewed();
  const updateProfile = useUpdateProfile();
  const upsertAddr = useUpsertAddress();
  const navigate = useNavigate();

  const profile = profileData?.profile;
  const defaultAddr = profileData?.defaultAddress;

  const [form, setForm] = useState({ full_name: "", phone: "", whatsapp: "" });
  const [addr, setAddr] = useState({ state_id: "", city_id: "", neighborhood_id: "", street: "", notes: "" });

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? "", phone: profile.phone ?? "", whatsapp: profile.whatsapp ?? "" });
    if (defaultAddr) setAddr({
      state_id: defaultAddr.state_id, city_id: defaultAddr.city_id,
      neighborhood_id: defaultAddr.neighborhood_id ?? "",
      street: defaultAddr.street ?? "", notes: defaultAddr.notes ?? "",
    });
    else if (states[0] && !addr.state_id) setAddr((a) => ({ ...a, state_id: states[0].id }));
  }, [profile, defaultAddr, states]);

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground">{t.nav.account}</h1>
          <p className="mt-3 text-muted-foreground">{lang === "ar" ? "يرجى تسجيل الدخول أولاً" : "Please sign in first"}</p>
          <Link to="/auth" className="mt-6 inline-flex min-h-[44px] items-center rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow">{t.nav.login}</Link>
        </div>
      </AppShell>
    );
  }

  const activeOrders = (orders as any[]).filter((o) => !["cancelled", "delivered", "returned"].includes(o.status));
  const pastOrders = (orders as any[]).filter((o) => ["delivered", "returned"].includes(o.status));
  const totalSpend = (orders as any[])
    .filter((o) => ["paid", "shipping", "delivered"].includes(o.status))
    .reduce((s, o) => s + Number(o.total_sdg ?? 0), 0);
  const cartCount = (cart?.items ?? []).reduce((s: number, i: any) => s + (i.qty ?? 0), 0);

  const viewedProducts = viewed
    .map((v) => allProducts.find((p) => p.slug === v.slug))
    .filter(Boolean)
    .slice(0, 4) as typeof allProducts;
  const recommended = allProducts.filter((p) => p.isBestSeller || p.isFeatured).slice(0, 4);

  const stateRow = states.find((s: any) => s.id === addr.state_id);
  const cities = stateRow?.cities ?? [];
  const cityRow = cities.find((c: any) => c.id === addr.city_id);
  const neighborhoods = cityRow?.neighborhoods ?? [];

  const profileComplete = !!(profile?.full_name && profile?.phone && profile?.whatsapp && defaultAddr);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync(form);
    if (addr.state_id && addr.city_id && addr.street) {
      await upsertAddr.mutateAsync({
        state_id: addr.state_id, city_id: addr.city_id,
        neighborhood_id: addr.neighborhood_id || null,
        street: addr.street, notes: addr.notes || null, is_default: true,
      });
    }
    toast.success(lang === "ar" ? "تم الحفظ" : "Saved");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 overflow-hidden rounded-3xl gradient-hero p-6 text-primary-foreground shadow-elevated md:p-8">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] opacity-80">{t.customer.welcome}</p>
              <h1 className="truncate font-display text-2xl md:text-3xl">
                {profile?.full_name || (lang === "ar" ? "عميلة ميتاكير" : "Metacare customer")}
              </h1>
              <p className="mt-0.5 text-sm opacity-90" dir="ltr">{profile?.phone}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-primary-foreground/15 px-4 text-xs font-medium backdrop-blur hover:bg-primary-foreground/25">
                <Globe className="h-3.5 w-3.5" />{lang === "ar" ? "English" : "العربية"}
              </button>
              <button onClick={async () => { await signOut(); navigate({ to: "/" }); }} className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-destructive/90 px-4 text-xs font-medium text-destructive-foreground hover:bg-destructive">
                <LogOut className="h-3.5 w-3.5" />{t.account.logout}
              </button>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-2">
            <Stat label={t.customer.ordersTotal} value={String((orders as any[]).length)} />
            <Stat label={t.customer.savedItems} value={String(wishlist.length)} />
            <Stat label={t.customer.spend} value={formatPrice(totalSpend, lang)} />
          </dl>

          {!profileComplete && (
            <p className="mt-4 rounded-2xl bg-primary-foreground/10 p-3 text-xs">
              {lang === "ar" ? "أكملي بياناتكِ في الملف الشخصي لتسهيل عملية الشراء." : "Please complete your profile to speed up checkout."}
            </p>
          )}
        </header>

        <nav aria-label={t.customer.quickActions} className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction to="/orders" icon={Package} label={t.account.orders} badge={activeOrders.length} />
          <QuickAction to="/cart" icon={ShoppingBag} label={t.nav.cart} badge={cartCount} />
          <QuickAction to="/notifications" icon={Bell} label={t.customer.notifications} />
          <QuickAction to="/support" icon={LifeBuoy} label={t.customer.support} />
        </nav>

        <Tabs defaultValue={profileComplete ? "overview" : "profile"} className="space-y-5">
          <TabsList className="flex w-full flex-wrap justify-start rounded-2xl bg-card p-1 shadow-glass">
            <TabTrigger value="overview" icon={LayoutGrid} label={t.customer.overview} />
            <TabTrigger value="orders" icon={Package} label={t.account.orders} />
            <TabTrigger value="wishlist" icon={Heart} label={t.account.wishlist} />
            <TabTrigger value="profile" icon={UserIcon} label={t.account.profile} />
            <TabTrigger value="settings" icon={ShieldCheck} label={t.customer.settings} />
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <Section title={t.account.activeOrders} action={<Link to="/orders" className="text-xs font-medium text-primary hover:underline">{t.customer.viewAll}</Link>}>
              {activeOrders.length === 0
                ? <Empty text={t.customer.noActiveOrders} />
                : <ul className="space-y-3">{activeOrders.slice(0, 3).map((o) => <li key={o.id}><OrderRow order={o} /></li>)}</ul>}
            </Section>

            {viewedProducts.length > 0 && (
              <Section title={t.customer.recentlyViewed} action={<button onClick={clearViewed} className="text-xs text-muted-foreground hover:text-foreground">{t.customer.clear}</button>}>
                <Grid>{viewedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</Grid>
              </Section>
            )}

            {recommended.length > 0 && (
              <Section title={t.customer.recommended}>
                <Grid>{recommended.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</Grid>
              </Section>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Section title={t.account.activeOrders}>
              {activeOrders.length === 0 ? <Empty text={t.customer.noActiveOrders} /> : <ul className="space-y-3">{activeOrders.map((o) => <li key={o.id}><OrderRow order={o} /></li>)}</ul>}
            </Section>
            <Section title={t.account.orderHistory} action={<Link to="/orders" className="text-xs font-medium text-primary hover:underline">{t.customer.viewAll}</Link>}>
              {pastOrders.length === 0 ? <Empty text={t.account.noOrders} /> : <ul className="space-y-3">{pastOrders.slice(0, 5).map((o) => <li key={o.id}><OrderRow order={o} /></li>)}</ul>}
            </Section>
          </TabsContent>

          <TabsContent value="wishlist">
            {wishlist.length === 0 ? <Empty text={t.account.noWishlist} /> : (
              <>
                <div className="mb-3 flex justify-end">
                  <Link to="/account/wishlist" className="text-xs font-medium text-primary hover:underline">{t.customer.viewAll}</Link>
                </div>
                <Grid>
                  {wishlist.slice(0, 8).map((w: any, i: number) => {
                    const p = w.product; if (!p) return null;
                    return <ProductCard key={p.id} product={toUIProduct(p)} index={i} />;
                  })}
                </Grid>
              </>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <form onSubmit={saveProfile} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-glass">
              <h3 className="font-display text-lg text-foreground">{t.account.profile}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label={t.checkout.fullName}><Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
                <Field label={t.checkout.phone}><Input required dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label={t.checkout.whatsapp} className="md:col-span-2"><Input required dir="ltr" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
              </div>
              <div className="my-2 h-px bg-border" />
              <h3 className="flex items-center gap-2 font-display text-lg text-foreground"><MapPin className="h-4 w-4 text-primary" />{t.customer.addresses}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label={t.checkout.state}>
                  <select value={addr.state_id} onChange={(e) => setAddr({ ...addr, state_id: e.target.value, city_id: "", neighborhood_id: "" })} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {states.map((s: any) => <option key={s.id} value={s.id}>{lang === "ar" ? s.name_ar : s.name_en}</option>)}
                  </select>
                </Field>
                <Field label={t.checkout.city}>
                  <select value={addr.city_id} onChange={(e) => setAddr({ ...addr, city_id: e.target.value, neighborhood_id: "" })} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">—</option>
                    {cities.map((c: any) => <option key={c.id} value={c.id}>{lang === "ar" ? c.name_ar : c.name_en}</option>)}
                  </select>
                </Field>
                <Field label={t.checkout.neighborhood}>
                  <select value={addr.neighborhood_id} onChange={(e) => setAddr({ ...addr, neighborhood_id: e.target.value })} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">—</option>
                    {neighborhoods.map((n: any) => <option key={n.id} value={n.id}>{lang === "ar" ? n.name_ar : n.name_en}</option>)}
                  </select>
                </Field>
                <Field label={t.checkout.street} className="md:col-span-2"><Input required value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} /></Field>
              </div>
              <button type="submit" className="min-h-[44px] rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow">{lang === "ar" ? "حفظ" : "Save"}</button>
            </form>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-glass">
              <h3 className="font-display text-lg text-foreground">{t.account.language}</h3>
              <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-muted">
                <Globe className="h-4 w-4" />{lang === "ar" ? "English" : "العربية"}
              </button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-glass">
              <h3 className="font-display text-lg text-foreground">{t.customer.security}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.customer.changePasswordHint}</p>
              <Link to="/support" className="mt-4 inline-flex min-h-[44px] items-center rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-muted">{t.customer.contactSupport}</Link>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-glass">
              <h3 className="font-display text-lg text-foreground">{t.customer.privacyLinks}</h3>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link to="/policies/privacy" className="text-primary hover:underline">{t.footer.privacy}</Link>
                <Link to="/policies/terms" className="text-primary hover:underline">{t.footer.terms}</Link>
                <Link to="/policies/returns" className="text-primary hover:underline">{t.footer.returns}</Link>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

export function toUIProduct(p: any) {
  const stock = Array.isArray(p.inventory) ? p.inventory[0]?.stock ?? 0 : p.inventory?.stock ?? 0;
  return {
    id: p.id, slug: p.slug,
    name: { ar: p.name_ar, en: p.name_en },
    brandId: null, categoryId: null,
    price: Number(p.price_sdg), compareAt: null,
    image: p.image_url || "/placeholder.svg",
    description: { ar: "", en: "" },
    inStock: stock > 0, isNew: false, isBestSeller: false, isFeatured: false,
  } as any;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-primary-foreground/10 p-3 backdrop-blur">
      <dt className="text-[11px] opacity-80">{label}</dt>
      <dd className="mt-0.5 truncate font-display text-base">{value}</dd>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, badge }: { to: string; icon: typeof Package; label: string; badge?: number }) {
  return (
    <Link to={to} className="relative flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-3 text-center shadow-glass transition hover:shadow-elevated">
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-xs font-medium text-foreground">{label}</span>
      {!!badge && badge > 0 && (
        <span className="absolute end-3 top-3 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">{badge}</span>
      )}
    </Link>
  );
}

function TabTrigger({ value, icon: Icon, label }: { value: string; icon: typeof Package; label: string }) {
  return (
    <TabsTrigger value={value} className="gap-2 rounded-full data-[state=active]:gradient-brand data-[state=active]:text-primary-foreground">
      <Icon className="h-3.5 w-3.5" />{label}
    </TabsTrigger>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h3 className="truncate font-display text-xl text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">{children}</div>;
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{text}</div>;
}
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
