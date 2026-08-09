import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { Logo } from "@/components/brand/Logo";
import { Instagram, Facebook, MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/lib/api/queries";

export function Footer() {
  const { t, lang } = useI18n();
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
          <FooterSocials />
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

// Admin-managed channels (site_settings); each icon hides when its value is empty.
function FooterSocials() {
  const { data: settings } = useSiteSettings();
  const waNumber = (settings?.contact_whatsapp ?? "").replace(/[^0-9]/g, "");

  const links = [
    settings?.instagram_url
      ? { key: "ig", href: settings.instagram_url, label: "Instagram", Icon: Instagram, cls: "bg-muted text-foreground hover:bg-muted/70" }
      : null,
    settings?.facebook_url
      ? { key: "fb", href: settings.facebook_url, label: "Facebook", Icon: Facebook, cls: "bg-muted text-foreground hover:bg-muted/70" }
      : null,
    waNumber
      ? { key: "wa", href: `https://wa.me/${waNumber}`, label: "WhatsApp", Icon: MessageCircle, cls: "bg-success text-success-foreground hover:opacity-90" }
      : null,
  ].filter(Boolean) as { key: string; href: string; label: string; Icon: typeof Instagram; cls: string }[];

  if (links.length === 0) return null;

  return (
    <div className="flex gap-2 pt-1">
      {links.map(({ key, href, label, Icon, cls }) => (
        <a
          key={key}
          className={`grid h-10 w-10 place-items-center rounded-full ${cls}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
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
