import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { useCart, useStatesTree, usePlaceOrder, useMyProfile } from "@/lib/api/queries";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";
import { MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { whatsappLink } from "@/lib/format";
import { METACARE_WHATSAPP } from "@/lib/config";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Metacare" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { data: cart } = useCart();
  const { data: profile } = useMyProfile();
  const { data: tree = [] } = useStatesTree();
  const place = usePlaceOrder();
  const navigate = useNavigate();
  const items = (cart?.items ?? []) as any[];

  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "", street: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  // Prefill from profile + default address
  useEffect(() => {
    if (!profile?.profile) return;
    setForm((p) => ({
      ...p,
      name: p.name || profile.profile?.full_name || "",
      phone: p.phone || profile.profile?.phone || "",
      whatsapp: p.whatsapp || profile.profile?.whatsapp || "",
      street: p.street || profile.defaultAddress?.street || "",
      notes: p.notes || profile.defaultAddress?.notes || "",
    }));
    if (profile.defaultAddress) {
      setStateId((s) => s || profile.defaultAddress.state_id);
      setCityId((s) => s || profile.defaultAddress.city_id);
      setNeighborhoodId((s) => s || (profile.defaultAddress.neighborhood_id ?? ""));
    } else if (tree[0] && !stateId) {
      setStateId(tree[0].id);
    }
  }, [profile, tree]);

  const stateRow = tree.find((s: any) => s.id === stateId);
  const cities = stateRow?.cities ?? [];
  const cityRow = cities.find((c: any) => c.id === cityId);
  const neighborhoods = cityRow?.neighborhoods ?? [];
  const neighborhood = neighborhoods.find((n: any) => n.id === neighborhoodId);
  const deliveryFee = useMemo(
    () => (neighborhood ? Number(neighborhood.delivery_fee_sdg) : 3000),
    [neighborhood],
  );
  const subtotal = items.reduce((s, l) => s + Number(l.product?.price_sdg ?? 0) * l.qty, 0);
  const total = subtotal + (items.length ? deliveryFee : 0);

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground">{t.checkout.title}</h1>
          <p className="mt-3 text-muted-foreground">{t.checkout.loginRequired}</p>
          <Link to="/auth" className="mt-6 inline-flex rounded-full gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow">{t.nav.login}</Link>
        </div>
      </AppShell>
    );
  }

  if (items.length === 0) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground">{t.cart.empty}</h1>
          <Link to="/products" className="mt-6 inline-flex rounded-full gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow">{t.cart.continueShopping}</Link>
        </div>
      </AppShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stateRow || !cityRow) { toast.error(lang === "ar" ? "اختاري الولاية والمدينة" : "Pick state & city"); return; }
    setSubmitting(true);
    try {
      const res = await place.mutateAsync({
        contact_name: form.name,
        contact_phone: form.phone,
        contact_whatsapp: form.whatsapp || form.phone,
        address_state: lang === "ar" ? stateRow.name_ar : stateRow.name_en,
        address_city: lang === "ar" ? cityRow.name_ar : cityRow.name_en,
        address_neighborhood: neighborhood ? (lang === "ar" ? neighborhood.name_ar : neighborhood.name_en) : undefined,
        address_street: form.street,
        address_notes: form.notes || undefined,
        delivery_sdg: deliveryFee,
      });
      const orderId = (res as { order: { id: string } }).order.id;
      navigate({ to: "/orders/$id", params: { id: orderId }, search: { confirmed: true } });
    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 font-display text-3xl text-foreground md:text-4xl">{t.checkout.title}</h1>

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <Card>
              <h3 className="mb-4 font-display text-lg text-foreground">{t.checkout.contact}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label={t.checkout.fullName}><Input required value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
                <Field label={t.checkout.phone}><Input required type="tel" dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="09xxxxxxxx" /></Field>
                <Field label={t.checkout.whatsapp} className="md:col-span-2"><Input required type="tel" dir="ltr" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="09xxxxxxxx" /></Field>
              </div>
            </Card>

            <Card>
              <h3 className="mb-1 flex items-center gap-2 font-display text-lg text-foreground"><MapPin className="h-4 w-4 text-primary" />{t.checkout.address}</h3>
              <p className="mb-4 text-xs text-muted-foreground">{t.checkout.wadMadaniOnly}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label={t.checkout.state}>
                  <select value={stateId} onChange={(e) => { setStateId(e.target.value); setCityId(""); setNeighborhoodId(""); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {tree.map((s: any) => <option key={s.id} value={s.id}>{lang === "ar" ? s.name_ar : s.name_en}</option>)}
                  </select>
                </Field>
                <Field label={t.checkout.city}>
                  <select value={cityId} onChange={(e) => { setCityId(e.target.value); setNeighborhoodId(""); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">—</option>
                    {cities.map((c: any) => <option key={c.id} value={c.id}>{lang === "ar" ? c.name_ar : c.name_en}</option>)}
                  </select>
                </Field>
                <Field label={t.checkout.neighborhood}>
                  <select value={neighborhoodId} onChange={(e) => setNeighborhoodId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">—</option>
                    {neighborhoods.map((n: any) => <option key={n.id} value={n.id}>{lang === "ar" ? n.name_ar : n.name_en} ({formatPrice(Number(n.delivery_fee_sdg), lang)})</option>)}
                  </select>
                </Field>
                <Field label={t.checkout.street} className="md:col-span-2"><Input required value={form.street} onChange={(e) => set("street", e.target.value)} /></Field>
                <Field label={t.checkout.notes} className="md:col-span-2"><Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
              </div>
            </Card>

            <Card>
              <h3 className="mb-3 flex items-center gap-2 font-display text-lg text-foreground"><ShieldCheck className="h-4 w-4 text-primary" />{t.checkout.payment}</h3>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm font-medium text-foreground">
                  {lang === "ar" ? "سيتواصل معكِ فريق خدمة العملاء" : "Customer Service will contact you"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {lang === "ar"
                    ? "بعد تأكيد الطلب، سيتواصل معكِ فريق خدمة العملاء عبر واتساب لترتيب الدفع وتفاصيل التوصيل. لا حاجة لإدخال أي بيانات دفع الآن."
                    : "After you place this order, our Customer Service team will reach out on WhatsApp to arrange payment and delivery. No payment details are required here."}
                </p>
                <a href={whatsappLink(METACARE_WHATSAPP, lang === "ar" ? "مرحباً، لدي طلب جديد وأودّ ترتيب الدفع والتوصيل" : "Hi, I have a new order and would like to arrange payment and delivery")} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full bg-success px-4 py-2 text-xs font-medium text-success-foreground">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {lang === "ar" ? "تواصلي معنا عبر واتساب" : "Contact us on WhatsApp"}
                </a>
              </div>
            </Card>
          </div>

          <aside className="h-fit space-y-3 rounded-2xl border border-border bg-card p-5 shadow-glass lg:sticky lg:top-24">
            <h3 className="font-display text-lg text-foreground">{t.cart.title}</h3>
            <ul className="space-y-2 text-sm">
              {items.map((l) => (
                <li key={l.product.id} className="flex justify-between gap-3">
                  <span className="line-clamp-1 text-foreground">{lang === "ar" ? l.product.name_ar : l.product.name_en} × {l.qty}</span>
                  <span className="shrink-0 text-muted-foreground">{formatPrice(Number(l.product.price_sdg) * l.qty, lang)}</span>
                </li>
              ))}
            </ul>
            <div className="my-2 h-px bg-border" />
            <Row label={t.cart.subtotal} value={formatPrice(subtotal, lang)} />
            <Row label={t.cart.delivery} value={formatPrice(deliveryFee, lang)} />
            <Row label={t.cart.total} value={formatPrice(total, lang)} strong />
            <button type="submit" disabled={submitting} className="mt-3 w-full rounded-full gradient-brand py-3 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-60">
              {submitting ? t.checkout.placing : t.checkout.placeOrder}
            </button>
          </aside>
        </form>
      </div>
    </AppShell>
  );
}

function Card({ children }: { children: React.ReactNode }) { return <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">{children}</div>; }
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-display text-lg text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}
