import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore, DELIVERY_FEE_SDG } from "@/lib/store";
import { findProduct } from "@/lib/mock-data";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";
import { Landmark, MapPin } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Metacare" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { t, lang } = useI18n();
  const cart = useStore((s) => s.cart);
  const user = useStore((s) => s.user);
  const placeOrder = useStore((s) => s.placeOrder);
  const navigate = useNavigate();

  const lines = cart.map((c) => ({ ...c, product: findProduct(c.productId)! })).filter((l) => l.product);
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const total = subtotal + (lines.length ? DELIVERY_FEE_SDG : 0);

  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    whatsapp: user?.whatsapp ?? "",
    neighborhood: "",
    street: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((p) => ({ ...p, [k]: v }));

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

  if (lines.length === 0) {
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
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    const order = placeOrder({
      name: form.name, phone: form.phone, whatsapp: form.whatsapp,
      address: { city: "Wad Madani", neighborhood: form.neighborhood, street: form.street, notes: form.notes },
    });
    navigate({ to: "/orders/$id", params: { id: order.id }, search: { confirmed: true } });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 font-display text-3xl text-foreground md:text-4xl">{t.checkout.title}</h1>

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <Card>
              <h3 className="mb-4 font-display text-lg text-foreground">{t.checkout.contact}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label={t.checkout.fullName}>
                  <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label={t.checkout.phone}>
                  <Input required type="tel" dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="09xxxxxxxx" />
                </Field>
                <Field label={t.checkout.whatsapp} className="md:col-span-2">
                  <Input required type="tel" dir="ltr" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="09xxxxxxxx" />
                </Field>
              </div>
            </Card>

            <Card>
              <h3 className="mb-1 flex items-center gap-2 font-display text-lg text-foreground"><MapPin className="h-4 w-4 text-primary" />{t.checkout.address}</h3>
              <p className="mb-4 text-xs text-muted-foreground">{t.checkout.wadMadaniOnly}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label={t.checkout.city}>
                  <Input disabled value={lang === "ar" ? "ود مدني" : "Wad Madani"} />
                </Field>
                <Field label={t.checkout.neighborhood}>
                  <Input required value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
                </Field>
                <Field label={t.checkout.street} className="md:col-span-2">
                  <Input required value={form.street} onChange={(e) => set("street", e.target.value)} />
                </Field>
                <Field label={t.checkout.notes} className="md:col-span-2">
                  <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </Field>
              </div>
            </Card>

            <Card>
              <h3 className="mb-3 flex items-center gap-2 font-display text-lg text-foreground"><Landmark className="h-4 w-4 text-primary" />{t.checkout.payment}</h3>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
                <input type="radio" checked readOnly className="h-4 w-4 accent-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t.checkout.bankTransfer}</p>
                  <p className="text-xs text-muted-foreground">{t.checkout.bankNote}</p>
                </div>
              </label>
            </Card>
          </div>

          <aside className="h-fit space-y-3 rounded-2xl border border-border bg-card p-5 shadow-glass lg:sticky lg:top-24">
            <h3 className="font-display text-lg text-foreground">{t.cart.title}</h3>
            <ul className="space-y-2 text-sm">
              {lines.map((l) => (
                <li key={l.productId} className="flex justify-between gap-3">
                  <span className="line-clamp-1 text-foreground">{l.product.name[lang]} × {l.qty}</span>
                  <span className="shrink-0 text-muted-foreground">{formatPrice(l.product.price * l.qty, lang)}</span>
                </li>
              ))}
            </ul>
            <div className="my-2 h-px bg-border" />
            <Row label={t.cart.subtotal} value={formatPrice(subtotal, lang)} />
            <Row label={t.cart.delivery} value={formatPrice(DELIVERY_FEE_SDG, lang)} />
            <Row label={t.cart.total} value={formatPrice(total, lang)} strong />
            <button
              type="submit"
              disabled={submitting}
              className="mt-3 w-full rounded-full gradient-brand py-3 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? t.checkout.placing : t.checkout.placeOrder}
            </button>
          </aside>
        </form>
      </div>
    </AppShell>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">{children}</div>;
}
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
