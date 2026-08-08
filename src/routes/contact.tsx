import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { MessageCircle, Phone, Mail, Clock, MapPin, Facebook, Instagram, Music2 } from "lucide-react";
import { COMPANY, waDigits } from "@/lib/company";
import { useSiteSettings } from "@/lib/api/queries";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا — Contact Metacare Beauty" },
      { name: "description", content: "تواصلي مع فريق ميتاكير بيوتي عبر واتساب، الهاتف أو البريد الإلكتروني." },
      { property: "og:title", content: "تواصل — Metacare Beauty" },
      { property: "og:url", content: "https://metacare-beauty-sudano.lovable.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://metacare-beauty-sudano.lovable.app/contact" }],
  }),
  component: ContactPage,
});

const WA = waDigits();

function ContactPage() {
  const { t, lang } = useI18n();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(`${subject}\n\n${message}`);
    window.open(`https://wa.me/${WA}?text=${text}`, "_blank");
  };
  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-3xl text-foreground md:text-5xl">{t.contact.title}</h1>
          <p className="mt-4 text-muted-foreground">{t.contact.lead}</p>
        </div>

        <SocialLinks />



        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer" className="group rounded-2xl border border-border bg-card p-5 shadow-glass transition hover:-translate-y-0.5 hover:shadow-elevated">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-success text-success-foreground"><MessageCircle className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-lg text-foreground">{t.contact.whatsapp}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.contact.whatsappSub}</p>
            <p className="mt-2 text-sm font-medium text-primary" dir="ltr">{COMPANY.whatsappDisplay}</p>
          </a>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted"><Phone className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-lg text-foreground">{t.contact.phone}</p>
            <p className="mt-2 text-sm font-medium text-foreground" dir="ltr">{COMPANY.phoneDisplay}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted"><Mail className="h-5 w-5" /></div>
            <p className="mt-3 font-display text-lg text-foreground">{t.contact.email}</p>
            <p className="mt-2 text-sm font-medium text-foreground">{COMPANY.email}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
            <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /><p className="font-display text-lg text-foreground">{t.contact.hours}</p></div>
            <p className="mt-2 text-sm text-muted-foreground">{COMPANY.hours[lang]}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
            <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /><p className="font-display text-lg text-foreground">{t.contact.address}</p></div>
            <p className="mt-2 text-sm text-muted-foreground">{COMPANY.address[lang]}</p>
          </div>
        </div>

        <form onSubmit={send} className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-glass md:p-8">
          <h2 className="font-display text-xl text-foreground">{t.contact.messageUs}</h2>
          <div className="mt-4 grid gap-3">
            <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t.contact.subject}
              className="h-12 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" />
            <textarea required value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.contact.message} rows={5}
              className="rounded-xl border border-border bg-background p-4 text-sm outline-none focus:border-primary" />
            <button type="submit" className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow">
              <MessageCircle className="h-4 w-4" />
              {t.contact.send}
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">{lang === "ar" ? "سيتم فتح واتساب لإرسال الرسالة" : "WhatsApp will open to send your message"}</p>
        </form>
      </section>
    </AppShell>
  );
}

// Admin-configured contact channels; each button hides when its value is empty.
function SocialLinks() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data: settings } = useSiteSettings();

  const waNumber = (settings?.contact_whatsapp ?? "").replace(/[^0-9]/g, "");
  const links = [
    waNumber ? { key: "wa", label: ar ? "واتساب" : "WhatsApp", href: `https://wa.me/${waNumber}`, Icon: MessageCircle, cls: "bg-success text-success-foreground" } : null,
    settings?.facebook_url ? { key: "fb", label: "Facebook", href: settings.facebook_url, Icon: Facebook, cls: "bg-muted text-foreground" } : null,
    settings?.instagram_url ? { key: "ig", label: "Instagram", href: settings.instagram_url, Icon: Instagram, cls: "bg-muted text-foreground" } : null,
    settings?.tiktok_url ? { key: "tt", label: "TikTok", href: settings.tiktok_url, Icon: Music2, cls: "bg-muted text-foreground" } : null,
  ].filter(Boolean) as { key: string; label: string; href: string; Icon: typeof MessageCircle; cls: string }[];

  if (links.length === 0) return null;

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      {links.map(({ key, label, href, Icon, cls }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground shadow-glass transition hover:-translate-y-0.5 hover:shadow-elevated"
        >
          <span className={`grid h-8 w-8 place-items-center rounded-full ${cls}`}><Icon className="h-4 w-4" /></span>
          {label}
        </a>
      ))}
    </div>
  );
}
