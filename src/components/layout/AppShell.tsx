import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CustomerBottomNav } from "@/components/customer/CustomerBottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { useSiteSettings } from "@/lib/api/queries";
import { Logo } from "@/components/brand/Logo";
import { COMPANY, waDigits } from "@/lib/company";
import { Clock, MessageCircle } from "lucide-react";

// Routes that must stay reachable while the storefront is closed, so admin and
// staff can still sign in and reach their own workspaces.
const ALWAYS_OPEN = ["/auth", "/admin", "/staff"];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isStaff } = useAuth();
  const { lang } = useI18n();
  const { data: settings } = useSiteSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const showTabs = !!user && !isStaff;
  const exempt = isStaff || ALWAYS_OPEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const closed = !!settings?.maintenance_mode && !exempt;

  if (closed) return <MaintenanceScreen settings={settings!} lang={lang} />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {showTabs && <div className="h-16 md:hidden" aria-hidden />}
      <CustomerBottomNav />
    </div>
  );
}

function MaintenanceScreen({
  settings, lang,
}: {
  settings: { maintenance_message_ar: string; maintenance_message_en: string };
  lang: "ar" | "en";
}) {
  const ar = lang === "ar";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gradient-aurora px-4 text-center">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 shadow-elevated backdrop-blur">
        <div className="mx-auto mb-5 w-fit"><Logo /></div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl gradient-brand text-primary-foreground">
          <Clock className="h-5 w-5" />
        </div>
        <h1 className="mt-4 font-display text-2xl text-foreground">
          {ar ? "المتجر مغلق مؤقتاً" : "We are temporarily closed"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {ar ? settings.maintenance_message_ar : settings.maintenance_message_en}
        </p>
        <a
          href={`https://wa.me/${(settings.contact_whatsapp ?? "").replace(/[^0-9]/g, "") || waDigits()}`}
          target="_blank" rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow"
        >
          <MessageCircle className="h-4 w-4" />
          {ar ? "تواصلي معنا عبر واتساب" : "Contact us on WhatsApp"}
        </a>
        <p className="mt-4 text-xs text-muted-foreground" dir="ltr">{settings.contact_whatsapp || COMPANY.whatsappDisplay}</p>
        <Link to="/auth" className="mt-5 block text-xs text-primary hover:underline">
          {ar ? "تسجيل الدخول" : "Sign in"}
        </Link>
      </div>
    </div>
  );
}
