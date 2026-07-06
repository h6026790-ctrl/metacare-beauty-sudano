import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/policies/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — Privacy Policy — Metacare" },
      { name: "description", content: "سياسة خصوصية ميتاكير بيوتي — حماية بياناتك الشخصية." },
      { property: "og:url", content: "https://metacare-beauty-sudano.lovable.app/policies/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://metacare-beauty-sudano.lovable.app/policies/privacy" }],
  }),
  component: () => <PolicyPage titleKey="privacyTitle" introKey="privacyIntro" />,
});

function PolicyPage({ titleKey, introKey }: { titleKey: "privacyTitle" | "termsTitle" | "returnsTitle"; introKey: "privacyIntro" | "termsIntro" | "returnsIntro" }) {
  const { t } = useI18n();
  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <h1 className="font-display text-3xl text-foreground md:text-5xl">{t.policies[titleKey]}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t.policies.lastUpdated}: 2026-01-01</p>
        <div className="prose mt-8 max-w-none text-foreground/90">
          <p className="leading-relaxed text-muted-foreground">{t.policies[introKey]}</p>
        </div>
      </section>
    </AppShell>
  );
}

export { PolicyPage };
