import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "الأسئلة الشائعة — FAQ — Metacare Beauty" },
      { name: "description", content: "إجابات لأكثر الأسئلة شيوعاً عن ميتاكير بيوتي: الأسعار، التوصيل، الدفع، والإرجاع." },
      { property: "og:title", content: "الأسئلة الشائعة — Metacare Beauty" },
      { property: "og:url", content: "https://metacare-beauty-sudano.lovable.app/faq" },
    ],
    links: [{ rel: "canonical", href: "https://metacare-beauty-sudano.lovable.app/faq" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: [1,2,3,4,5,6].map((i) => ({
          "@type": "Question", name: `Q${i}`,
          acceptedAnswer: { "@type": "Answer", text: `A${i}` },
        })),
      }),
    }],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { t } = useI18n();
  const items = [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
    { q: t.faq.q5, a: t.faq.a5 },
    { q: t.faq.q6, a: t.faq.a6 },
  ];
  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <h1 className="font-display text-3xl text-foreground md:text-5xl">{t.faq.title}</h1>
        <p className="mt-3 text-muted-foreground">{t.faq.lead}</p>

        <Accordion type="single" collapsible className="mt-8">
          {items.map((it, i) => (
            <AccordionItem key={i} value={`i${i}`} className="border-border">
              <AccordionTrigger className="text-start font-display text-base text-foreground">{it.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{it.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-center shadow-glass">
          <p className="text-sm text-muted-foreground">{t.visitor.registerBanner}</p>
          <Link to="/auth" className="mt-4 inline-flex rounded-full gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow">{t.visitor.registerCta}</Link>
        </div>
      </section>
    </AppShell>
  );
}
