// Staff personal profile — the only self-service surface inside /staff.
// Structured as independent sections so later additions (performance stats,
// messages from the administrator) drop in without reworking this page.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { UserRound, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { useMyProfile, useChangePassword } from "@/lib/api/queries";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/staff/profile")({
  head: () => ({
    meta: [
      { title: "ملفي الشخصي — خدمة العملاء ميتاكير" },
      { name: "description", content: "بيانات حسابك الشخصي وتغيير كلمة المرور داخل مكتب خدمة العملاء." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffProfile,
});

function StaffProfile() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-foreground md:text-3xl">{ar ? "ملفي الشخصي" : "My profile"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar ? "بياناتك الخاصة داخل مكتب خدمة العملاء." : "Your own details inside the Customer Service desk."}
        </p>
      </div>

      <IdentitySection />
      <PasswordSection />
    </div>
  );
}

function Section({ icon: Icon, title, sub, children }: {
  icon: typeof UserRound; title: string; sub?: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-glass">
      <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
        <Icon className="h-4 w-4 text-primary" />{title}
      </h2>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function IdentitySection() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user, isStaff } = useAuth();
  const { data: profile, isLoading } = useMyProfile();

  const name = profile?.profile?.full_name || (ar ? "غير محدد" : "Not set");
  const phone = profile?.profile?.phone ?? "";

  return (
    <Section
      icon={UserRound}
      title={ar ? "بياناتي" : "My details"}
      sub={ar ? "لتعديل الاسم أو رقم الهاتف تواصل مع الإدارة." : "To change your name or phone number, contact the administrator."}
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{ar ? "جارٍ التحميل…" : "Loading…"}</p>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2">
          <Row label={ar ? "الاسم" : "Name"} value={name} />
          <Row label={ar ? "رقم الهاتف" : "Phone"} value={phone} ltr />
          <Row
            label={ar ? "الصلاحية" : "Role"}
            value={isStaff ? (ar ? "خدمة العملاء" : "Customer Service") : "—"}
          />
          <Row label={ar ? "معرّف الحساب" : "Account ID"} value={user?.id.slice(0, 8) ?? "—"} ltr />
        </dl>
      )}
    </Section>
  );
}

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground" dir={ltr ? "ltr" : undefined}>{value}</dd>
    </div>
  );
}

function PasswordSection() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) {
      toast.error(ar ? "كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف" : "New password must be at least 8 characters");
      return;
    }
    if (next !== confirm) {
      toast.error(ar ? "تأكيد كلمة المرور غير مطابق" : "Password confirmation does not match");
      return;
    }
    try {
      await change.mutateAsync({ current_password: current, new_password: next });
      toast.success(ar ? "تم تغيير كلمة المرور" : "Password changed");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err: any) {
      toast.error(err?.message ?? (ar ? "تعذر تغيير كلمة المرور" : "Could not change the password"));
    }
  };

  return (
    <Section
      icon={KeyRound}
      title={ar ? "تغيير كلمة المرور" : "Change password"}
      sub={ar ? "استخدم كلمة مرور قوية لا تشاركها مع أحد." : "Use a strong password and keep it to yourself."}
    >
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label className="mb-1.5 block text-xs text-muted-foreground">{ar ? "كلمة المرور الحالية" : "Current password"}</Label>
          <Input required type="password" autoComplete="current-password" dir="ltr" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">{ar ? "كلمة المرور الجديدة" : "New password"}</Label>
          <Input required type="password" autoComplete="new-password" dir="ltr" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">{ar ? "تأكيد كلمة المرور" : "Confirm password"}</Label>
          <Input required type="password" autoComplete="new-password" dir="ltr" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={change.isPending}
            className="min-h-[42px] rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-50"
          >
            {change.isPending ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "تحديث كلمة المرور" : "Update password")}
          </button>
        </div>
      </form>
    </Section>
  );
}
