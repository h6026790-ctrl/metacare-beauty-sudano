import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { useMyOrders, useMyProfile, useUpdateProfile, useUpsertAddress, useStatesTree, useWishlist } from "@/lib/api/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { OrderStatusBadge } from "@/components/OrderTimeline";
import { formatDate, formatPrice } from "@/lib/format";
import { LogOut, User as UserIcon, Heart, Package, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — Metacare" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const { data: profileData } = useMyProfile();
  const { data: orders = [] } = useMyOrders();
  const { data: wishlist = [] } = useWishlist();
  const { data: states = [] } = useStatesTree();
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
          <Link to="/auth" className="mt-6 inline-flex rounded-full gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow">{t.nav.login}</Link>
        </div>
      </AppShell>
    );
  }

  const activeOrders = orders.filter((o: any) => !["cancelled","delivered","returned"].includes(o.status));
  const pastOrders = orders.filter((o: any) => ["delivered","returned"].includes(o.status));

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
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 overflow-hidden rounded-3xl gradient-hero p-8 text-primary-foreground shadow-elevated">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-foreground/15"><UserIcon className="h-6 w-6" /></div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] opacity-80">{t.nav.account}</p>
                <h1 className="font-display text-3xl">{profile?.full_name || (lang === "ar" ? "عميلة ميتاكير" : "Metacare customer")}</h1>
                <p className="mt-0.5 text-sm opacity-90" dir="ltr">{profile?.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2 text-xs font-medium backdrop-blur hover:bg-primary-foreground/25">
                <Globe className="h-3.5 w-3.5" />{lang === "ar" ? "English" : "العربية"}
              </button>
              <button onClick={async () => { await signOut(); navigate({ to: "/" }); }} className="inline-flex items-center gap-2 rounded-full bg-destructive/90 px-4 py-2 text-xs font-medium text-destructive-foreground hover:bg-destructive">
                <LogOut className="h-3.5 w-3.5" />{t.account.logout}
              </button>
            </div>
          </div>
          {!profileComplete && (
            <div className="mt-4 rounded-2xl bg-primary-foreground/10 p-3 text-xs">
              {lang === "ar" ? "أكملي بياناتكِ في الملف الشخصي لتسهيل عملية الشراء." : "Please complete your profile to speed up checkout."}
            </div>
          )}
        </div>

        <Tabs defaultValue={profileComplete ? "orders" : "profile"} className="space-y-5">
          <TabsList className="rounded-full bg-card p-1 shadow-glass">
            <TabsTrigger value="orders" className="gap-2 rounded-full data-[state=active]:gradient-brand data-[state=active]:text-primary-foreground"><Package className="h-3.5 w-3.5" />{t.account.orders}</TabsTrigger>
            <TabsTrigger value="wishlist" className="gap-2 rounded-full data-[state=active]:gradient-brand data-[state=active]:text-primary-foreground"><Heart className="h-3.5 w-3.5" />{t.account.wishlist}</TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 rounded-full data-[state=active]:gradient-brand data-[state=active]:text-primary-foreground"><UserIcon className="h-3.5 w-3.5" />{t.account.profile}</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <Section title={t.account.activeOrders}>{activeOrders.length === 0 ? <Empty text={t.account.noOrders} /> : <OrderList orders={activeOrders} />}</Section>
            <Section title={t.account.orderHistory}>{pastOrders.length === 0 ? <Empty text={t.account.noOrders} /> : <OrderList orders={pastOrders} />}</Section>
          </TabsContent>

          <TabsContent value="wishlist">
            {wishlist.length === 0 ? <Empty text={t.account.noWishlist} /> : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                {wishlist.map((w: any, i: number) => {
                  const p = w.product; if (!p) return null;
                  const ui = { id: p.id, slug: p.slug, name: { ar: p.name_ar, en: p.name_en }, price: Number(p.price_sdg), image: p.image_url || "/placeholder.svg", inStock: (Array.isArray(p.inventory) ? p.inventory[0]?.stock : p.inventory?.stock) > 0, isNew: false, isBestSeller: false, isFeatured: false, brandId: null, categoryId: null, description: { ar: "", en: "" }, compareAt: null } as any;
                  return <ProductCard key={p.id} product={ui} index={i} />;
                })}
              </div>
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
              <h3 className="font-display text-lg text-foreground">{t.checkout.address}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label={t.checkout.state}>
                  <select value={addr.state_id} onChange={(e) => setAddr({ ...addr, state_id: e.target.value, city_id: "", neighborhood_id: "" })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {states.map((s: any) => <option key={s.id} value={s.id}>{lang === "ar" ? s.name_ar : s.name_en}</option>)}
                  </select>
                </Field>
                <Field label={t.checkout.city}>
                  <select value={addr.city_id} onChange={(e) => setAddr({ ...addr, city_id: e.target.value, neighborhood_id: "" })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">—</option>
                    {cities.map((c: any) => <option key={c.id} value={c.id}>{lang === "ar" ? c.name_ar : c.name_en}</option>)}
                  </select>
                </Field>
                <Field label={t.checkout.neighborhood}>
                  <select value={addr.neighborhood_id} onChange={(e) => setAddr({ ...addr, neighborhood_id: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">—</option>
                    {neighborhoods.map((n: any) => <option key={n.id} value={n.id}>{lang === "ar" ? n.name_ar : n.name_en}</option>)}
                  </select>
                </Field>
                <Field label={t.checkout.street} className="md:col-span-2"><Input required value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} /></Field>
              </div>
              <button type="submit" className="rounded-full gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow">{lang === "ar" ? "حفظ" : "Save"}</button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <div><h3 className="mb-3 font-display text-xl text-foreground">{title}</h3>{children}</div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{text}</div>; }
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
function OrderList({ orders }: { orders: any[] }) {
  const { lang, t } = useI18n();
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id}>
          <Link to="/orders/$id" params={{ id: o.id }} search={{}} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-glass transition hover:shadow-elevated">
            <div>
              <p className="font-mono text-sm font-medium tracking-wider text-foreground">{o.number}</p>
              <p className="text-xs text-muted-foreground">{formatDate(o.placed_at, lang)} • {(o.order_items?.length ?? 0)} {t.cart.item}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">{formatPrice(Number(o.total_sdg), lang)}</span>
              <OrderStatusBadge status={o.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
