// Team center — who holds which role.
import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { CenterHeader } from "@/components/admin/ui";
import { useAdminTeam } from "@/components/admin/useAdminWorkspace";

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

  return (
    <>
      <CenterHeader
        title={lang === "ar" ? "الفريق" : "Team"}
        sub={lang === "ar" ? "من يملك أي صلاحية داخل النظام." : "Who holds which permission inside the system."}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <TeamCol title={lang === "ar" ? "مديرون" : "Administrators"} members={teamQ.data?.admins ?? []} />
        <TeamCol title={lang === "ar" ? "خدمة العملاء" : "Customer Service"} members={teamQ.data?.staff ?? []} />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {lang === "ar"
          ? "منح الأدوار وسحبها يتم حالياً من قاعدة البيانات مباشرة."
          : "Role grants and revocations are performed directly in the database for now."}
      </p>
    </>
  );
}

function TeamCol({ title, members }: { title: string; members: any[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-2 font-display text-sm text-foreground">{title} <span className="text-muted-foreground">({members.length})</span></h2>
      <ul className="space-y-1.5">
        {members.length === 0 ? (
          <li className="text-xs text-muted-foreground">—</li>
        ) : members.map((m) => (
          <li key={m.id} className="flex items-center justify-between text-xs text-foreground">
            <span>{m.full_name || "—"}</span>
            <span dir="ltr" className="font-mono text-muted-foreground">{m.phone}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
