import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { useProducts, useBrands, useCategories, type UIProduct } from "@/lib/api/queries";
import { ArrowLeft, ArrowRight, ShieldCheck, Truck, MessageCircle, Sparkles, UserPlus, ChevronDown, MapPin, Clock, QrCode } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import heroImg from "@/assets/hero-serum.jpg";
import bannerImg from "@/assets/banner-offers.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Metacare Beauty — ميتاكير بيوتي" },
      { name: "description", content: "تجربة تسوق فاخرة للجمال في ود مدني — العناية بالبشرة، المكياج والعطور. منتجات أصلية 100٪." },
      { property: "og:title", content: "Metacare Beauty — ميتاكير بيوتي" },
      { property: "og:description", content: "تجربة تسوق فاخرة للجمال في ود مدني — العناية بالبشرة، المكياج والعطور." },
      { property: "og:url", content: "https://metacare-beauty-sudano.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://metacare-beauty-sudano.lovable.app/" }],
  }),
  component: HomePage,
});

function HomePage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const { data: all = [] } = useProducts();
  const { data: brands = [] } = useBrands();
  const { data: categories = [] } = useCategories();
  const featured = all.filter((p) => p.isFeatured);
  const newArrivals = all.filter((p) => p.isNew);
  const bestSellers = all.filter((p) => p.isBestSeller);

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-aurora" />
        <div className="absolute -top-32 -end-32 h-96 w-96 rounded-full bg-violet/20 blur-3xl" />
        <div className="absolute -bottom-32 -start-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-violet" />
              {t.home.heroEyebrow}
            </span>
            <h1 className="font-display text-3xl leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">{t.home.heroTitle}</h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">{t.home.heroSub}</p>
            <div className="flex flex-wrap gap-3">
              {!user ? (
                <>
                  <Link to="/auth" className="group inline-flex h-12 items-center gap-2 rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-95">
                    <UserPlus className="h-4 w-4" />
                    {t.visitor.registerCta}
                    <Arrow className="h-4 w-4 transition group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                  </Link>
                  <Link to="/products" className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground hover:bg-muted">
                    {t.home.heroCta}
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/products" className="group inline-flex h-12 items-center gap-2 rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-95">
                    {t.home.heroCta}
                    <Arrow className="h-4 w-4 transition group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                  </Link>
                  <Link to="/brands" className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground hover:bg-muted">
                    {t.home.heroCta2}
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative aspect-[4/5] max-h-[560px] overflow-hidden rounded-3xl shadow-elevated">
            <img src={heroImg} alt="" width={1600} height={1200} className="h-full w-full object-cover" />
            {all[0] && (
              <div className="absolute inset-x-4 bottom-4 rounded-2xl glass p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{lang === "ar" ? "اختيار اليوم" : "Today's pick"}</p>
                <p className="font-display text-lg text-foreground">{all[0].name[lang]}</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <TrustCard icon={ShieldCheck} title={t.home.trust1Title} sub={t.home.trust1Sub} />
          <TrustCard icon={Truck} title={t.home.trust2Title} sub={t.home.trust2Sub} />
          <TrustCard icon={MessageCircle} title={t.home.trust3Title} sub={t.home.trust3Sub} />
          <TrustCard icon={Sparkles} title={t.home.trust4Title} sub={t.home.trust4Sub} />
        </div>
      </section>

      {/* Featured Categories */}
      <Section title={t.home.categories} link="/categories">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.id} to="/products" search={{ category: c.slug }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-glass transition hover:-translate-y-0.5 hover:shadow-elevated">
              <span className="absolute -end-6 -top-6 text-7xl text-accent/20 transition group-hover:text-accent/40">{c.icon}</span>
              <p className="font-display text-xl text-foreground">{c.name[lang]}</p>
              <p className="mt-1 text-xs text-muted-foreground">{lang === "ar" ? "اكتشفي المجموعة" : "Explore the collection"}</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* Featured Brands */}
      <Section title={t.home.brands} link="/brands">
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {brands.slice(0, 6).map((b) => (
            <Link key={b.id} to="/brands/$id" params={{ id: b.slug }}
              className="group rounded-2xl border border-border bg-card p-4 text-center shadow-glass transition hover:-translate-y-0.5 hover:shadow-elevated">
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-xl gradient-aurora font-display text-lg text-primary">
                {b.name[lang].slice(0, 1)}
              </div>
              <p className="font-display text-sm text-foreground">{b.name[lang]}</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* Best Sellers */}
      <Section title={t.home.bestSellers} link="/products"><ProductGrid items={bestSellers} /></Section>

      {/* New Arrivals */}
      <Section title={t.home.newArrivals} link="/products"><ProductGrid items={newArrivals} /></Section>

      {/* Offers banner */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="relative overflow-hidden rounded-3xl">
          <img src={bannerImg} alt="" width={1600} height={700} loading="lazy" className="h-56 w-full object-cover md:h-72" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 md:p-12">
            <p className="text-xs uppercase tracking-[0.25em] text-primary-foreground/80">{lang === "ar" ? "عرض حصري" : "Exclusive"}</p>
            <h3 className="max-w-md font-display text-3xl text-primary-foreground md:text-5xl">
              {lang === "ar" ? "خصم حتى ٢٠٪ على عروض هذا الأسبوع" : "Up to 20% off this week"}
            </h3>
            <Link to="/offers" className="mt-2 w-fit rounded-full bg-primary-foreground px-5 py-2.5 text-sm font-medium text-primary">{lang === "ar" ? "استكشفي العروض" : "See offers"}</Link>
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <Section title={t.home.featured} link="/products"><ProductGrid items={featured} /></Section>
      )}

      {/* Why Metacare */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl text-foreground md:text-4xl">{t.home.trustTitle}</h2>
          <p className="mt-3 text-muted-foreground">{lang === "ar" ? "أربعة أسباب تجعلنا وجهتكِ الأولى للجمال." : "Four reasons we're your first stop for beauty."}</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <TrustCard icon={ShieldCheck} title={t.home.trust1Title} sub={t.home.trust1Sub} />
          <TrustCard icon={Truck} title={t.home.trust2Title} sub={t.home.trust2Sub} />
          <TrustCard icon={MessageCircle} title={t.home.trust3Title} sub={t.home.trust3Sub} />
          <TrustCard icon={Sparkles} title={t.home.trust4Title} sub={t.home.trust4Sub} />
        </div>
        {!user && (
          <div className="mt-8 text-center">
            <Link to="/auth" className="inline-flex h-12 items-center gap-2 rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow">
              <UserPlus className="h-4 w-4" />
              {t.visitor.registerCta}
            </Link>
          </div>
        )}
      </section>

      {/* Delivery info */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-glass md:grid-cols-3 md:p-8">
          <DeliveryPoint icon={MapPin} title={t.delivery.areaTitle} body={t.delivery.area} />
          <DeliveryPoint icon={Clock} title={t.delivery.timeTitle} body={t.delivery.time} />
          <DeliveryPoint icon={QrCode} title={t.delivery.confirmTitle} body={t.delivery.confirm} />
        </div>
      </section>

      {/* FAQ preview */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl text-foreground md:text-3xl">{t.faq.title}</h2>
          <Link to="/faq" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {lang === "ar" ? "عرض الكل" : "View all"}
            <Arrow className="h-4 w-4" />
          </Link>
        </div>
        <Accordion type="single" collapsible>
          {[{ q: t.faq.q1, a: t.faq.a1 }, { q: t.faq.q2, a: t.faq.a2 }, { q: t.faq.q3, a: t.faq.a3 }].map((it, i) => (
            <AccordionItem key={i} value={`f${i}`} className="border-border">
              <AccordionTrigger className="text-start font-display text-base text-foreground">{it.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{it.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Testimonials placeholder */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="mb-5 font-display text-2xl text-foreground md:text-3xl">{lang === "ar" ? "آراء عميلاتنا" : "Customer stories"}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[1,2,3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-glass">
              <div className="flex gap-1 text-violet">{"★★★★★".split("").map((s, k) => <span key={k}>{s}</span>)}</div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {lang === "ar"
                  ? "تجربة رائعة، منتجات أصلية والتوصيل كان سريعاً جداً."
                  : "A wonderful experience — authentic products, delivered very fast."}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">— {lang === "ar" ? "عميلة من ود مدني" : "Customer, Wad Madani"}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact strip */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-8 text-center shadow-glass md:flex-row md:justify-between md:text-start">
          <div>
            <h3 className="font-display text-2xl text-foreground">{t.contact.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t.contact.lead}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="https://wa.me/249900000000" target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-success px-5 text-sm font-medium text-success-foreground">
              <MessageCircle className="h-4 w-4" />
              {t.visitor.askOnWhatsapp}
            </a>
            <Link to="/contact" className="inline-flex h-12 items-center rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-muted">
              {t.contact.title}
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Section({ title, link, children }: { title: string; link?: string; children: React.ReactNode }) {
  const { lang } = useI18n();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="font-display text-2xl text-foreground md:text-3xl">{title}</h2>
        {link && (
          <Link to={link} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {lang === "ar" ? "عرض الكل" : "View all"}
            <Arrow className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}
function ProductGrid({ items }: { items: UIProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
      {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
    </div>
  );
}
function TrustCard({ icon: Icon, title, sub }: { icon: typeof ShieldCheck; title: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
      <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 font-display text-lg text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
function DeliveryPoint({ icon: Icon, title, body }: { icon: typeof MapPin; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/40 text-accent-foreground"><Icon className="h-5 w-5" /></div>
      <div>
        <p className="font-display text-base text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
// Suppress unused import warning (ChevronDown reserved for future use)
void ChevronDown;
