import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  submitRegistrationRequest,
  submitPasswordResetRequest,
  verifyRegistrationOtp,
} from "@/lib/api/auth.functions";
import { useStatesTree } from "@/lib/api/queries";
import { MessageCircle, Clock } from "lucide-react";
import { whatsappLink } from "@/lib/format";
import { METACARE_WHATSAPP } from "@/lib/config";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Metacare" }] }),
  component: AuthPage,
});

function normalizePhone(input: string): string {
  let p = input.trim().replace(/\s+/g, "");
  if (p.startsWith("+")) return p;
  if (p.startsWith("00")) return "+" + p.slice(2);
  if (p.startsWith("0")) return "+249" + p.slice(1);
  if (p.startsWith("249")) return "+" + p;
  return "+249" + p;
}
function phoneToEmail(phone: string) {
  return `${phone.replace(/[^0-9]/g, "")}@phone.metacare.local`;
}

type Mode = "login" | "register" | "forgot";

function AuthPage() {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const submitFn = useServerFn(submitRegistrationRequest);
  const resetFn = useServerFn(submitPasswordResetRequest);
  const verifyFn = useServerFn(verifyRegistrationOtp);
  const { data: tree = [] } = useStatesTree();

  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    password: "",
    street: "",
    notes: "",
    otp: "",
    stateId: "",
    cityId: "",
    neighborhoodId: "",
  });

  const stateRow = tree.find((s: any) => s.id === form.stateId);
  const cities = stateRow?.cities ?? [];
  const cityRow = cities.find((c: any) => c.id === form.cityId);
  const neighborhoods = cityRow?.neighborhoods ?? [];

  const resetForm = (m: Mode) => {
    setMode(m);
    setStep("form");
    setForm((f) => ({ ...f, otp: "", password: "" }));
  };

  // ---- LOGIN: direct phone + password ----
  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const email = phoneToEmail(normalizePhone(form.phone));
      const { error } = await supabase.auth.signInWithPassword({ email, password: form.password });
      if (error) throw error;
      toast.success(lang === "ar" ? "أهلاً بكِ" : "Welcome");
      navigate({ to: await destinationForCurrentUser() });
    } catch (err: any) {
      toast.error(
        lang === "ar"
          ? "رقم الجوال أو كلمة المرور غير صحيحة"
          : "Invalid phone number or password",
      );
    } finally {
      setBusy(false);
    }
  };

  // ---- REGISTER / FORGOT: submit request → wait for OTP ----
  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error(lang === "ar" ? "كلمة المرور 8 أحرف على الأقل" : "Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        await submitFn({
          data: {
            full_name: form.name,
            phone: form.phone,
            whatsapp: form.whatsapp || form.phone,
            password: form.password,
            street: form.street || null,
            notes: form.notes || null,
            state_id: form.stateId || null,
            city_id: form.cityId || null,
            neighborhood_id: form.neighborhoodId || null,
          },
        });
      } else {
        await resetFn({ data: { phone: form.phone, password: form.password } });
      }
      toast.success(
        lang === "ar"
          ? "تم استلام طلبكِ. سيتواصل معكِ فريق خدمة العملاء عبر واتساب بالرمز."
          : "Request received. Customer Service will send your code on WhatsApp shortly.",
      );
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message || (lang === "ar" ? "تعذّر الإرسال" : "Failed"));
    } finally {
      setBusy(false);
    }
  };

  // ---- Verify OTP for register or reset, then sign in ----
  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await verifyFn({
        data: {
          phone: form.phone,
          otp: form.otp,
          password: form.password,
          request_type: mode === "register" ? "register" : "reset",
        },
      });
      const { error } = await supabase.auth.signInWithPassword({
        email: (res as any).email,
        password: form.password,
      });
      if (error) throw error;
      toast.success(
        mode === "register"
          ? (lang === "ar" ? "تم تفعيل حسابكِ" : "Account activated")
          : (lang === "ar" ? "تم تحديث كلمة المرور" : "Password updated"),
      );
      navigate({ to: await destinationForCurrentUser() });
    } catch (err: any) {
      toast.error(err.message || (lang === "ar" ? "تعذّر التحقق" : "Verification failed"));
    } finally {
      setBusy(false);
    }
  };

  const waitingMsg = lang === "ar"
    ? `مرحباً، طلبت ${mode === "register" ? "إنشاء حساب" : "استعادة كلمة المرور"} في ميتاكير. رقمي: ${normalizePhone(form.phone)}. أرجو إرسال رمز التحقق.`
    : `Hello, I just requested ${mode === "register" ? "an account" : "a password reset"} on Metacare. My phone: ${normalizePhone(form.phone)}. Please send my verification code.`;

  return (
    <AppShell>
      <div className="relative mx-auto grid min-h-[80vh] max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-2">
        <div className="hidden space-y-5 md:block">
          <Logo />
          <h1 className="font-display text-4xl text-foreground">
            {lang === "ar" ? "أهلاً بكِ في ميتاكير" : "Welcome to Metacare"}
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            {lang === "ar"
              ? "تسجيل الدخول برقم الجوال وكلمة المرور. تفعيل الحساب الجديد يتم يدوياً عبر فريق خدمة العملاء."
              : "Sign in with your phone and password. New accounts are activated manually by Customer Service."}
          </p>
        </div>

        <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-elevated md:p-8">
          <div className="mb-5 flex gap-2 rounded-full bg-muted p-1">
            <Tab active={mode === "login"} onClick={() => resetForm("login")}>
              {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
            </Tab>
            <Tab active={mode === "register"} onClick={() => resetForm("register")}>
              {lang === "ar" ? "حساب جديد" : "Create account"}
            </Tab>
          </div>

          {/* ---------------- LOGIN ---------------- */}
          {mode === "login" && (
            <form onSubmit={doLogin} className="space-y-3">
              <Field label={lang === "ar" ? "رقم الجوال" : "Mobile number"} hint={lang === "ar" ? "مثال: 09xxxxxxxx" : "e.g. 09xxxxxxxx"}>
                <Input required type="tel" dir="ltr" placeholder="09xxxxxxxx"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label={lang === "ar" ? "كلمة المرور" : "Password"}>
                <Input required type="password" autoComplete="current-password"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
              <button type="submit" disabled={busy}
                className="mt-2 w-full rounded-full gradient-brand py-3 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-60">
                {busy ? "…" : (lang === "ar" ? "تسجيل الدخول" : "Sign in")}
              </button>
              <button type="button" onClick={() => resetForm("forgot")}
                className="block w-full pt-1 text-center text-xs text-primary hover:underline">
                {lang === "ar" ? "نسيتِ كلمة المرور؟" : "Forgot password?"}
              </button>
              <Link to="/" className="block pt-2 text-center text-xs text-muted-foreground hover:text-foreground">
                {lang === "ar" ? "تصفّحي كزائرة" : "Browse as guest"}
              </Link>
            </form>
          )}

          {/* ---------------- REGISTER ---------------- */}
          {mode === "register" && step === "form" && (
            <form onSubmit={sendRequest} className="space-y-3">
              <Field label={lang === "ar" ? "الاسم الكامل" : "Full name"}>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label={lang === "ar" ? "رقم الجوال" : "Mobile number"} hint={lang === "ar" ? "مثال: 09xxxxxxxx" : "e.g. 09xxxxxxxx"}>
                <Input required type="tel" dir="ltr" placeholder="09xxxxxxxx"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label={lang === "ar" ? "رقم الواتساب" : "WhatsApp number"} hint={lang === "ar" ? "نستخدمه للتواصل بشأن طلباتكِ" : "Used to reach you about your orders"}>
                <Input required type="tel" dir="ltr" placeholder="09xxxxxxxx"
                  value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </Field>
              <Field label={lang === "ar" ? "كلمة المرور" : "Password"} hint={lang === "ar" ? "8 أحرف على الأقل" : "At least 8 characters"}>
                <Input required type="password" minLength={8} autoComplete="new-password"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>

              <div className="grid grid-cols-1 gap-2">
                <Field label={lang === "ar" ? "الولاية" : "State"}>
                  <select value={form.stateId} onChange={(e) => setForm({ ...form, stateId: e.target.value, cityId: "", neighborhoodId: "" })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">—</option>
                    {tree.map((s: any) => <option key={s.id} value={s.id}>{lang === "ar" ? s.name_ar : s.name_en}</option>)}
                  </select>
                </Field>
                <Field label={lang === "ar" ? "المدينة" : "City"}>
                  <select value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value, neighborhoodId: "" })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" disabled={!form.stateId}>
                    <option value="">—</option>
                    {cities.map((c: any) => <option key={c.id} value={c.id}>{lang === "ar" ? c.name_ar : c.name_en}</option>)}
                  </select>
                </Field>
                <Field label={lang === "ar" ? "الحي" : "Neighborhood"}>
                  <select value={form.neighborhoodId} onChange={(e) => setForm({ ...form, neighborhoodId: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" disabled={!form.cityId}>
                    <option value="">—</option>
                    {neighborhoods.map((n: any) => <option key={n.id} value={n.id}>{lang === "ar" ? n.name_ar : n.name_en}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={lang === "ar" ? "الشارع / المعلم" : "Street / landmark"}>
                <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
              </Field>
              <Field label={lang === "ar" ? "ملاحظات" : "Notes"}>
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Field>

              <button type="submit" disabled={busy}
                className="mt-2 w-full rounded-full gradient-brand py-3 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-60">
                {busy ? "…" : (lang === "ar" ? "إرسال الطلب" : "Submit request")}
              </button>
            </form>
          )}

          {/* ---------------- FORGOT PASSWORD ---------------- */}
          {mode === "forgot" && step === "form" && (
            <form onSubmit={sendRequest} className="space-y-3">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
                {lang === "ar"
                  ? "أدخلي رقم جوالكِ وكلمة المرور الجديدة. سيتواصل معكِ فريق خدمة العملاء عبر واتساب بالرمز، ثم يمكنكِ التحقق وتفعيل كلمة المرور الجديدة."
                  : "Enter your phone number and the new password you want. Customer Service will WhatsApp you a code; enter it to activate the new password."}
              </div>
              <Field label={lang === "ar" ? "رقم الجوال" : "Mobile number"}>
                <Input required type="tel" dir="ltr" placeholder="09xxxxxxxx"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label={lang === "ar" ? "كلمة المرور الجديدة" : "New password"} hint={lang === "ar" ? "8 أحرف على الأقل" : "At least 8 characters"}>
                <Input required type="password" minLength={8} autoComplete="new-password"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
              <button type="submit" disabled={busy}
                className="mt-2 w-full rounded-full gradient-brand py-3 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-60">
                {busy ? "…" : (lang === "ar" ? "إرسال طلب الاستعادة" : "Request reset")}
              </button>
              <button type="button" onClick={() => resetForm("login")}
                className="block w-full pt-1 text-center text-xs text-muted-foreground hover:text-foreground">
                {lang === "ar" ? "رجوع لتسجيل الدخول" : "Back to sign in"}
              </button>
            </form>
          )}

          {/* ---------------- OTP VERIFICATION ---------------- */}
          {(mode === "register" || mode === "forgot") && step === "otp" && (
            <form onSubmit={verify} className="space-y-4">
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  {lang === "ar" ? "بانتظار رمز التحقق" : "Awaiting your code"}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {lang === "ar"
                    ? "سيتواصل معكِ فريق خدمة العملاء عبر واتساب لإرسال الرمز المكوّن من 6 أرقام."
                    : "Our Customer Service team will WhatsApp you the 6-digit code."}
                </p>
                <a href={whatsappLink(METACARE_WHATSAPP, waitingMsg)} target="_blank" rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-success px-4 py-2 text-xs font-medium text-success-foreground">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {lang === "ar" ? "محادثة خدمة العملاء" : "Chat with Customer Service"}
                </a>
              </div>

              <Field label={lang === "ar" ? "رمز التحقق" : "Verification code"}>
                <Input required dir="ltr" inputMode="numeric" maxLength={6} placeholder="••••••"
                  value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })}
                  className="text-center text-2xl tracking-[0.5em]" />
              </Field>
              <button type="submit" disabled={busy}
                className="w-full rounded-full gradient-brand py-3 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-60">
                {busy ? "…" : (lang === "ar" ? "تحقق" : "Verify")}
              </button>
              <button type="button" onClick={() => setStep("form")}
                className="block w-full pt-1 text-center text-xs text-muted-foreground hover:text-foreground">
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
    <button type="button" onClick={onClick}
      className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-card text-foreground shadow-glass" : "text-muted-foreground"}`}>
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
