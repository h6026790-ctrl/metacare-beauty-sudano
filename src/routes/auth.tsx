import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Metacare" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { t, lang } = useI18n();
  const login = useStore((s) => s.login);
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "", otp: "" });

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("otp");
  };
  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    // Phase 1: mock OTP, accept anything
    const name = mode === "register" ? form.name : (lang === "ar" ? "ضيفتنا الكريمة" : "Welcome back");
    login({ name, phone: form.phone, whatsapp: form.whatsapp || form.phone });
    navigate({ to: "/account" });
  };

  return (
    <AppShell>
      <div className="relative mx-auto grid min-h-[80vh] max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-2">
        <div className="hidden space-y-5 md:block">
          <Logo />
          <h1 className="font-display text-4xl text-foreground">{lang === "ar" ? "أهلاً بكِ في ميتاكير" : "Welcome to Metacare"}</h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            {lang === "ar"
              ? "سجّلي الدخول لاكتشاف أسعارنا الخاصة، حفظ مفضلاتكِ ومتابعة طلباتكِ."
              : "Sign in to unlock prices, save favourites and track your orders."}
          </p>
          <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-glass backdrop-blur">
            <p className="text-sm text-muted-foreground">{t.auth.mobileNote}</p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-elevated md:p-8">
          <div className="mb-5 flex gap-2 rounded-full bg-muted p-1">
            <Tab active={mode === "login"} onClick={() => { setMode("login"); setStep("form"); }}>{t.auth.login}</Tab>
            <Tab active={mode === "register"} onClick={() => { setMode("register"); setStep("form"); }}>{t.auth.register}</Tab>
          </div>

          {step === "form" ? (
            <form onSubmit={next} className="space-y-3">
              {mode === "register" && (
                <Field label={t.auth.fullName}>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
              )}
              <Field label={t.auth.phone} hint={t.auth.mobileNote}>
                <Input required type="tel" dir="ltr" placeholder={t.auth.phHint} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              {mode === "register" && (
                <Field label={t.auth.whatsapp} hint={t.auth.whatsappNote}>
                  <Input required type="tel" dir="ltr" placeholder={t.auth.phHint} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                </Field>
              )}
              <button type="submit" className="mt-2 w-full rounded-full gradient-brand py-3 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95">
                {t.auth.sendOtp}
              </button>
              <Link to="/" className="block pt-2 text-center text-xs text-muted-foreground hover:text-foreground">{t.auth.continueAsGuest}</Link>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {lang === "ar" ? "أدخلي الرمز المرسل إلى" : "Enter the code sent to"}
                <span dir="ltr" className="ms-1 font-medium text-foreground">{form.phone}</span>
              </p>
              <Field label={t.auth.otp}>
                <Input required dir="ltr" inputMode="numeric" maxLength={6} placeholder="••••••" value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} className="text-center text-2xl tracking-[0.5em]" />
              </Field>
              <p className="text-[11px] text-muted-foreground">
                {lang === "ar"
                  ? "في النسخة التجريبية: أي رمز يعمل. OTP الفعلي يأتي في المرحلة الثانية."
                  : "Demo build — any code works. Real OTP wired in Phase 2."}
              </p>
              <button type="submit" className="mt-2 w-full rounded-full gradient-brand py-3 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95">
                {t.auth.verify}
              </button>
              <button type="button" onClick={() => setStep("form")} className="block w-full pt-1 text-center text-xs text-muted-foreground hover:text-foreground">
                {lang === "ar" ? "تعديل البيانات" : "Edit details"}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Tab({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-card text-foreground shadow-glass" : "text-muted-foreground"}`}>
      {children}
    </button>
  );
}
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
