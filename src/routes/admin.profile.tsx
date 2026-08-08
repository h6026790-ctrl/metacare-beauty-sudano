// Administrator personal account — self-service password change.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { UserRound, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { useMyProfile, useChangePassword } from "@/lib/api/queries";
import { CenterHeader } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({
    meta: [
      { title: "حسابي — إدارة ميتاكير" },
      { name: "description", content: "بيانات حساب المدير وتغيير كلمة المرور." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminProfile,
});

function Section({ icon: Icon, title, sub, children }: {
  icon: typeof UserRound; title: string; sub?: string; children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-glass">
      <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
        <Icon className="h-4 w-4 text-primary" />{title}
      </h2>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
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

function AdminProfile() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useAuth();
  const { data: profile, isLoading } = useMyProfile();
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
    <>
      <CenterHeader
        title={ar ? "حسابي" : "My account"}
        sub={ar ? "بيانات حسابك الإداري وكلمة المرور." : "Your administrator account details and password."}
      />

      <Section icon={UserRound} title={ar ? "بياناتي" : "My details"}>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{ar ? "جارٍ التحميل…" : "Loading…"}</p>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            <Row label={ar ? "الاسم" : "Name"} value={profile?.profile?.full_name || (ar ? "غير محدد" : "Not set")} />
            <Row label={ar ? "رقم الهاتف" : "Phone"} value={profile?.profile?.phone ?? ""} ltr />
            <Row label={ar ? "الصلاحية" : "Role"} value={ar ? "مدير" : "Administrator"} />
            <Row label={ar ? "معرّف الحساب" : "Account ID"} value={user?.id.slice(0, 8) ?? "—"} ltr />
          </dl>
        )}
      </Section>

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
    </>
  );
}
