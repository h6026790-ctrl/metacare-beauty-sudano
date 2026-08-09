import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { MessageCircle, Phone, Mail, Clock, MapPin, Facebook, Instagram, Music2 } from "lucide-react";
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

function ContactPage() {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const { data: settings } = useSiteSettings();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const waNumber = (settings?.contact_whatsapp ?? "").replace(/[^0-9]/g, "");
  const phone = settings?.contact_phone?.trim() ?? "";
  const email = settings?.contact_email?.trim() ?? "";
  const address = (ar ? settings?.address_ar : settings?.address_en)?.trim() ?? "";
  const hours = (ar ? settings?.hours_ar : settings?.hours_en)?.trim() ?? "";

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waNumber) return;
    const text = encodeURIComponent(`${subject}\n\n${message}`);
    window.open(`https://wa.me/${waNumber}?text=${text}`, "_blank");
  };

  const infoCards = [
    phone ? { key: "phone", Icon: Phone, title: t.contact.phone, value: phone, ltr: true } : null,
    email ? { key: "email", Icon: Mail, title: t.contact.email, value: email, ltr: true } : null,
  ].filter(Boolean) as { key: string; Icon: typeof Phone; title: string; value: string; ltr?: boolean }[];

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-3xl text-foreground md:text-5xl">{t.contact.title}</h1>
          <p className="mt-4 text-muted-foreground">{t.contact.lead}</p>
        </div>

        <ContactChannels />

        {infoCards.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {infoCards.map(({ key, Icon, title, value, ltr }) => (
              <div key={key} className="rounded-2xl border border-border bg-card p-5 shadow-glass">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted"><Icon className="h-5 w-5" /></div>
                <p className="mt-3 font-display text-lg text-foreground">{title}</p>
                <p className="mt-2 text-sm font-medium text-foreground" dir={ltr ? "ltr" : undefined}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {(hours || address) && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {hours && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
                <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /><p className="font-display text-lg text-foreground">{t.contact.hours}</p></div>
                <p className="mt-2 text-sm text-muted-foreground">{hours}</p>
              </div>
            )}
            {address && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-glass">
                <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /><p className="font-display text-lg text-foreground">{t.contact.address}</p></div>
                <p className="mt-2 text-sm text-muted-foreground">{address}</p>
              </div>
            )}
          </div>
        )}

        {waNumber && (
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
            <p className="mt-3 text-center text-xs text-muted-foreground">{ar ? "سيتم فتح واتساب لإرسال الرسالة" : "WhatsApp will open to send your message"}</p>
          </form>
        )}
      </section>
    </AppShell>
  );
}

// Admin-configured contact channels grouped together; WhatsApp is the primary
// (large) button, the remaining networks are compact icon buttons beside it.
function ContactChannels() {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const { data: settings } = useSiteSettings();

  const waNumber = (settings?.contact_whatsapp ?? "").replace(/[^0-9]/g, "");
  const socials = [
    settings?.facebook_url ? { key: "fb", label: "Facebook", href: settings.facebook_url, Icon: Facebook } : null,
    settings?.instagram_url ? { key: "ig", label: "Instagram", href: settings.instagram_url, Icon: Instagram } : null,
    settings?.tiktok_url ? { key: "tt", label: "TikTok", href: settings.tiktok_url, Icon: Music2 } : null,
  ].filter(Boolean) as { key: string; label: string; href: string; Icon: typeof Facebook }[];

  if (!waNumber && socials.length === 0) return null;

  return (
    <div className="mt-10 rounded-3xl border border-border bg-card p-5 shadow-glass md:p-6">
      <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-between">
        {waNumber && (
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-1 items-center gap-4 rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-success text-success-foreground">
              <MessageCircle className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-lg text-foreground">{t.contact.whatsapp}</span>
              <span className="block text-sm text-muted-foreground">{t.contact.whatsappSub}</span>
              <span className="mt-1 block text-sm font-medium text-primary" dir="ltr">{settings?.contact_whatsapp}</span>
            </span>
          </a>
        )}

        {socials.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {socials.map(({ key, label, href, Icon }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                title={label}
                className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background text-foreground transition hover:-translate-y-0.5 hover:bg-muted"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        )}
      </div>
      {!waNumber && (
        <p className="mt-3 text-center text-xs text-muted-foreground">{ar ? "تابعينا على منصاتنا" : "Follow us on our channels"}</p>
      )}
    </div>
  );
}
