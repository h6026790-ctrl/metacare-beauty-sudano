import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/brand/Logo";
import { Instagram, Facebook, MessageCircle } from "lucide-react";

export function Footer() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {lang === "ar"
              ? "ميتاكير بيوتي — وجهتكِ الفاخرة للعناية بالبشرة، المكياج والعطور في ود مدني."
              : "Metacare Beauty — your luxury destination for skincare, makeup and fragrance in Wad Madani."}
          </p>
          <div className="flex gap-2 pt-1">
            <a className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground hover:bg-muted/70" href="#" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>
            <a className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground hover:bg-muted/70" href="#" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>
            <a className="grid h-10 w-10 place-items-center rounded-full bg-success text-success-foreground hover:opacity-90" href="https://wa.me/249900000000" target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></a>
          </div>
          {!user && (
            <Link to="/auth" className="mt-4 inline-flex rounded-full gradient-brand px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow">
              {t.footer.createAccount}
            </Link>
          )}
        </div>
        <FooterCol title={t.footer.shop} links={[
          { label: t.nav.categories, to: "/categories" },
          { label: t.nav.brands, to: "/brands" },
          { label: t.nav.offers, to: "/offers" },
          { label: t.home.newArrivals, to: "/products" },
        ]} />
        <FooterCol title={t.footer.company} links={[
          { label: t.nav.about, to: "/about" },
          { label: t.nav.contact, to: "/contact" },
          { label: t.nav.delivery, to: "/delivery" },
          { label: t.nav.faq, to: "/faq" },
        ]} />
        <FooterCol title={t.footer.legal} links={[
          { label: t.footer.privacy, to: "/policies/privacy" },
          { label: t.footer.terms, to: "/policies/terms" },
          { label: t.footer.returns, to: "/policies/returns" },
        ]} />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Metacare Beauty — {t.footer.rights}</p>
          <p>{t.footer.sudan}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div className="space-y-3 text-sm">
      <h4 className="font-display text-base text-foreground">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}><Link to={l.to} className="text-muted-foreground hover:text-foreground">{l.label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
