import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { Truck, Clock, Coins, QrCode, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/delivery")({
  head: () => ({
    meta: [
      { title: "التوصيل — Delivery — Metacare Beauty" },
      { name: "description", content: "توصيل سريع وموثوق داخل ود مدني — نفس اليوم أو خلال ٢٤ ساعة." },
      { property: "og:title", content: "التوصيل — Metacare Beauty" },
      { property: "og:url", content: "https://metacare-beauty-sudano.lovable.app/delivery" },
    ],
    links: [{ rel: "canonical", href: "https://metacare-beauty-sudano.lovable.app/delivery" }],
  }),
  component: DeliveryPage,
});

function DeliveryPage() {
  const { t } = useI18n();
  const items = [
    { icon: Truck, title: t.delivery.areaTitle, body: t.delivery.area },
    { icon: Clock, title: t.delivery.timeTitle, body: t.delivery.time },
    { icon: Coins, title: t.delivery.feeTitle, body: t.delivery.fee },
    { icon: QrCode, title: t.delivery.confirmTitle, body: t.delivery.confirm },
    { icon: MessageCircle, title: t.delivery.contactTitle, body: t.delivery.contact },
  ];
  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        <h1 className="font-display text-3xl text-foreground md:text-5xl">{t.delivery.title}</h1>
        <p className="mt-3 text-muted-foreground">{t.delivery.lead}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-border bg-card p-5 shadow-glass">
              <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow"><it.icon className="h-5 w-5" /></div>
              <p className="mt-3 font-display text-lg text-foreground">{it.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
