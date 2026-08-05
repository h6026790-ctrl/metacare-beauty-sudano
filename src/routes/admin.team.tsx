// Team center — who holds which role, plus staff account management.
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { CenterHeader } from "@/components/admin/ui";
import { useAdminTeam } from "@/components/admin/useAdminWorkspace";
import { adminCreateStaffAccount, adminDeleteStaffAccount, adminSetUserRole } from "@/lib/api/admin.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Trash2, UserPlus, Copy } from "lucide-react";

export const Route = createFileRoute("/admin/team")({
  head: () => ({
    meta: [
      { title: "الفريق — إدارة ميتاكير" },
      { name: "description", content: "أعضاء الإدارة وخدمة العملاء وأدوارهم داخل النظام." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminTeam,
});

function AdminTeam() {
  const { lang } = useI18n();
  const { user, isAdmin } = useAuth();
  const teamQ = useAdminTeam(!!user && isAdmin);
  const qc = useQueryClient();

  const createFn = useServerFn(adminCreateStaffAccount);
  const deleteFn = useServerFn(adminDeleteStaffAccount);
  const roleFn = useServerFn(adminSetUserRole);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ phone: string; password: string } | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["adm-team"] });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setBusy(true);
    try {
      const res = await createFn({ data: { full_name: name.trim(), phone: phone.trim() } });
      setCreated({ phone: res.phone, password: res.password });
      setName(""); setPhone("");
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? (lang === "ar" ? "تعذّر إنشاء الحساب" : "Could not create account"));
    } finally { setBusy(false); }
  };

  const promote = async (id: string) => {
    setBusy(true);
    try {
      await roleFn({ data: { userId: id, role: "admin", grant: true } });
      toast.success(lang === "ar" ? "تمت الترقية إلى مدير" : "Promoted to administrator");
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Error");
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await deleteFn({ data: { userId: id } });
      toast.success(lang === "ar" ? "تم حذف الحساب" : "Account deleted");
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Error");
    } finally { setBusy(false); }
  };

  return (
    <>
      <CenterHeader
        title={lang === "ar" ? "الفريق" : "Team"}
        sub={lang === "ar" ? "من يملك أي صلاحية داخل النظام." : "Who holds which permission inside the system."}
      />

      <form onSubmit={submit} className="mb-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm text-foreground">
          <UserPlus className="h-4 w-4" />
          {lang === "ar" ? "إضافة موظف خدمة عملاء" : "Add a customer-service member"}
        </h2>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === "ar" ? "الاسم الكامل" : "Full name"} />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder={lang === "ar" ? "رقم الهاتف" : "Phone number"} />
          <Button type="submit" disabled={busy}>{lang === "ar" ? "إنشاء الحساب" : "Create account"}</Button>
        </div>
        {created && (
          <div className="mt-3 rounded-xl border border-primary/40 bg-primary/5 p-3 text-xs">
            <p className="font-medium text-foreground">
              {lang === "ar"
                ? "كلمة المرور تظهر مرة واحدة فقط — انسخيها الآن."
                : "This password is shown only once — copy it now."}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code dir="ltr" className="rounded bg-muted px-2 py-1 font-mono text-foreground">{created.phone}</code>
              <code dir="ltr" className="rounded bg-muted px-2 py-1 font-mono text-foreground">{created.password}</code>
              <button
                type="button"
                onClick={() => { navigator.clipboard?.writeText(created.password); toast.success(lang === "ar" ? "تم النسخ" : "Copied"); }}
                className="grid h-7 w-7 place-items-center rounded-lg hover:bg-muted"
                aria-label="copy"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <button type="button" onClick={() => setCreated(null)} className="mt-2 text-muted-foreground hover:underline">
              {lang === "ar" ? "إخفاء" : "Hide"}
            </button>
          </div>
        )}
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        <TeamCol
          title={lang === "ar" ? "مديرون" : "Administrators"}
          members={teamQ.data?.admins ?? []}
          lang={lang}
          busy={busy}
          currentId={user?.id}
          onDelete={remove}
        />
        <TeamCol
          title={lang === "ar" ? "خدمة العملاء" : "Customer Service"}
          members={teamQ.data?.staff ?? []}
          lang={lang}
          busy={busy}
          currentId={user?.id}
          onPromote={promote}
          onDelete={remove}
        />
      </div>
    </>
  );
}

function TeamCol({
  title, members, lang, busy, currentId, onPromote, onDelete,
}: {
  title: string;
  members: any[];
  lang: string;
  busy: boolean;
  currentId?: string;
  onPromote?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-2 font-display text-sm text-foreground">{title} <span className="text-muted-foreground">({members.length})</span></h2>
      <ul className="space-y-1.5">
        {members.length === 0 ? (
          <li className="text-xs text-muted-foreground">—</li>
        ) : members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2 text-xs text-foreground">
            <span className="truncate">{m.full_name || "—"}</span>
            <span className="flex items-center gap-1">
              <span dir="ltr" className="font-mono text-muted-foreground">{m.phone}</span>
              {onPromote && (
                <button
                  disabled={busy}
                  onClick={() => onPromote(m.id)}
                  title={lang === "ar" ? "ترقية إلى مدير" : "Promote to admin"}
                  className="grid h-7 w-7 place-items-center rounded-lg hover:bg-muted disabled:opacity-50"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && m.id !== currentId && (
                <button
                  disabled={busy}
                  onClick={() => onDelete(m.id)}
                  title={lang === "ar" ? "حذف الحساب" : "Delete account"}
                  className="grid h-7 w-7 place-items-center rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-muted-foreground">
        {lang === "ar"
          ? "لكل مستخدم دور واحد فقط؛ الترقية تستبدل الدور الحالي."
          : "Each user holds exactly one role; promoting replaces the current role."}
      </p>
    </div>
  );
}
