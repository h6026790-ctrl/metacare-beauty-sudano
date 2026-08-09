import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { ShieldCheck, Sparkles, MessageCircle, FlaskConical, MapPin } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "عن ميتاكير بيوتي — About Metacare Beauty" },
      { name: "description", content: "قصة ميتاكير بيوتي، رسالتنا وقيمنا في تقديم منتجات الجمال الأصلية بخدمة استثنائية في ود مدني." },
      { property: "og:title", content: "عن ميتاكير بيوتي — About Metacare Beauty" },
      { property: "og:description", content: "قصة علامة سودانية للجمال، أصالة وخدمة فاخرة." },
      { property: "og:url", content: "https://metacare-beauty-sudano.lovable.app/about" },
    ],
    links: [{ rel: "canonical", href: "https://metacare-beauty-sudano.lovable.app/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t, lang } = useI18n();
  const values = [
    { icon: ShieldCheck, title: t.about.value1, sub: t.about.value1Sub },
    { icon: Sparkles, title: t.about.value2, sub: t.about.value2Sub },
    { icon: FlaskConical, title: t.about.value3, sub: t.about.value3Sub },
    { icon: MessageCircle, title: t.about.value4, sub: t.about.value4Sub },
  ];
  return (
    <AppShell>
      <section className="relative overflow-hidden gradient-aurora">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-violet" /> {lang === "ar" ? "قصتنا" : "Our story"}
          </span>
          <h1 className="mt-5 font-display text-4xl leading-tight text-foreground md:text-6xl">{t.about.title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">{t.about.lead}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl text-foreground md:text-3xl">{t.about.storyTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{t.about.story}</p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground md:text-3xl">{t.about.missionTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{t.about.mission}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-6 font-display text-2xl text-foreground md:text-3xl">{t.about.valuesTitle}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-5 shadow-glass">
              <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow">
                <v.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 font-display text-lg text-foreground">{v.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{v.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-glass">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/40 text-accent-foreground">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-xl text-foreground">{t.about.coverageTitle}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{t.about.coverage}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            
            <Link to="/contact" className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground hover:bg-muted">{t.contact.title}</Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
