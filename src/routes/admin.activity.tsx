// Activity center — the system-wide audit trail.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/format";
import { CenterHeader } from "@/components/admin/ui";
import { useAdminAudits } from "@/components/admin/useAdminWorkspace";

export const Route = createFileRoute("/admin/activity")({
  head: () => ({
    meta: [
      { title: "سجل النشاط — إدارة ميتاكير" },
      { name: "description", content: "سجل تدقيق كامل لكل التغييرات الحساسة داخل النظام." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminActivity,
});

function AdminActivity() {
  const { lang } = useI18n();
  const { user, isAdmin } = useAuth();
  const [q, setQ] = useState("");
  const auditsQ = useAdminAudits(!!user && isAdmin);

  const term = q.trim().toLowerCase();
  const rows = ((auditsQ.data ?? []) as any[]).filter(
    (a) => !term || String(a.action ?? "").toLowerCase().includes(term) || String(a.entity_type ?? "").toLowerCase().includes(term),
  );

  return (
    <>
      <CenterHeader
        title={lang === "ar" ? "سجل النشاط" : "Activity"}
        sub={lang === "ar" ? "من فعل ماذا ومتى داخل النظام." : "Who did what, and when, inside the system."}
      />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={lang === "ar" ? "تصفية حسب الإجراء أو النوع" : "Filter by action or entity"}
        className="mb-4 h-10 w-full max-w-sm rounded-xl border border-input bg-background px-3 text-sm"
      />

      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.length === 0 ? (
          <li className="p-8 text-center text-sm text-muted-foreground">{lang === "ar" ? "لا توجد سجلات" : "No entries"}</li>
        ) : rows.map((a) => (
          <li key={a.id} className="grid grid-cols-[130px_1fr_auto] items-center gap-3 p-3 text-xs">
            <span className="font-mono text-muted-foreground">{formatDate(a.at, lang)}</span>
            <span className="text-foreground">{a.action} · {a.entity_type}</span>
            <span className="truncate font-mono text-[10px] text-muted-foreground">{a.entity_id}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
