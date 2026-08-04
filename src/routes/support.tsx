import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { whatsappLink } from "@/lib/format";
import { METACARE_WHATSAPP } from "@/lib/config";
import { MessageCircle, Clock, HelpCircle, Truck, RotateCcw, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Help & Support — Metacare Beauty" },
      { name: "description", content: "Reach the Metacare Beauty customer service team on WhatsApp, or browse delivery, returns and payment answers." },
      { property: "og:title", content: "Help & Support — Metacare Beauty" },
      { property: "og:description", content: "Reach Metacare Beauty customer service on WhatsApp for orders, delivery and returns." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { t, lang } = useI18n();
  const wa = whatsappLink(
    METACARE_WHATSAPP,
    lang === "ar" ? "مرحباً ميتاكير، أحتاج مساعدة بخصوص طلبي." : "Hi Metacare, I need help with my order.",
  );

  const cards = [
    { icon: Truck, title: t.nav.delivery, body: t.delivery.lead ?? "", to: "/delivery" as const },
    { icon: RotateCcw, title: t.footer.returns, body: t.policies.returnsIntro, to: "/policies/returns" as const },
    { icon: HelpCircle, title: t.customer.faqShort, body: t.faq.lead ?? "", to: "/faq" as const },
    { icon: ShieldCheck, title: t.footer.privacy, body: t.policies.privacyIntro, to: "/policies/privacy" as const },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8">
          <h1 className="font-display text-3xl text-foreground md:text-4xl">{t.customer.support}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.customer.supportSub}</p>
        </header>

        <section className="rounded-3xl gradient-hero p-7 text-primary-foreground shadow-elevated">
          <h2 className="font-display text-2xl">{t.customer.supportWhatsapp}</h2>
          <p className="mt-1 flex items-center gap-2 text-sm opacity-90">
            <Clock className="h-4 w-4" />{t.customer.supportHours}
          </p>
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-success px-6 text-sm font-medium text-success-foreground shadow-glow hover:opacity-95"
          >
            <MessageCircle className="h-4 w-4" />
            {t.customer.contactSupport}
          </a>
        </section>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.to} to={c.to} className="rounded-2xl border border-border bg-card p-5 shadow-glass transition hover:shadow-elevated">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-display text-lg text-foreground">{c.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{c.body}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
