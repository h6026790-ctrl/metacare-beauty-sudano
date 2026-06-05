import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Metacare" }] }),
  component: AuthPage,
});

// Normalize Sudan phone numbers to E.164 (+249...)
function normalizePhone(input: string): string {
  let p = input.trim().replace(/\s+/g, "");
  if (p.startsWith("+")) return p;
  if (p.startsWith("00")) return "+" + p.slice(2);
  if (p.startsWith("0")) return "+249" + p.slice(1);
  if (p.startsWith("249")) return "+" + p;
  return "+249" + p;
}

function AuthPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "", otp: "" });

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const phone = normalizePhone(form.phone);
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          data: mode === "register"
            ? { full_name: form.name, whatsapp: normalizePhone(form.whatsapp || form.phone) }
            : undefined,
        },
      });
      if (error) throw error;
      toast.success(lang === "ar" ? "تم إرسال رمز التحقق" : "Verification code sent");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message || (lang === "ar" ? "تعذّر الإرسال" : "Failed to send code"));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const phone = normalizePhone(form.phone);
      const { error } = await supabase.auth.verifyOtp({ phone, token: form.otp, type: "sms" });
      if (error) throw error;
      toast.success(lang === "ar" ? "أهلاً بكِ" : "Welcome");
      navigate({ to: "/account" });
    } catch (err: any) {
      toast.error(err.message || (lang === "ar" ? "رمز غير صحيح" : "Invalid code"));
    } finally {
      setBusy(false);
    }
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
            <form onSubmit={sendOtp} className="space-y-3">
              {mode === "register" && (
                <Field label={t.auth.fullName}>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
              )}
              <Field label={t.auth.phone} hint={t.auth.mobileNote}>
                <Input required type="tel" dir="ltr" placeholder="09xxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              {mode === "register" && (
                <Field label={t.auth.whatsapp} hint={t.auth.whatsappNote}>
                  <Input type="tel" dir="ltr" placeholder="09xxxxxxxx" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                </Field>
              )}
              <button type="submit" disabled={busy} className="mt-2 w-full rounded-full gradient-brand py-3 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-60">
                {busy ? "…" : t.auth.sendOtp}
              </button>
              <Link to="/" className="block pt-2 text-center text-xs text-muted-foreground hover:text-foreground">{t.auth.continueAsGuest}</Link>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {lang === "ar" ? "أدخلي الرمز المرسل إلى" : "Enter the code sent to"}
                <span dir="ltr" className="ms-1 font-medium text-foreground">{normalizePhone(form.phone)}</span>
              </p>
              <Field label={t.auth.otp}>
                <Input required dir="ltr" inputMode="numeric" maxLength={6} placeholder="••••••" value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} className="text-center text-2xl tracking-[0.5em]" />
              </Field>
              <button type="submit" disabled={busy} className="mt-2 w-full rounded-full gradient-brand py-3 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-60">
                {busy ? "…" : t.auth.verify}
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
