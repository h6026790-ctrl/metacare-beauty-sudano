// System center — company configuration surface (read-only for now).
import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { COMPANY } from "@/lib/company";
import { CenterHeader } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/system")({
  head: () => ({
    meta: [
      { title: "النظام — إدارة ميتاكير" },
      { name: "description", content: "بيانات الشركة وإعدادات النظام المعتمدة في كل الواجهات." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSystem,
});

function AdminSystem() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  const rows: { label: string; value: string; ltr?: boolean }[] = [
    { label: ar ? "اسم الشركة" : "Company name", value: ar ? COMPANY.name.ar : COMPANY.name.en },
    { label: ar ? "واتساب" : "WhatsApp", value: COMPANY.whatsappDisplay, ltr: true },
    { label: ar ? "الهاتف" : "Phone", value: COMPANY.phoneDisplay, ltr: true },
    { label: ar ? "البريد" : "Email", value: COMPANY.email, ltr: true },
    { label: ar ? "العنوان" : "Address", value: ar ? COMPANY.address.ar : COMPANY.address.en },
    { label: ar ? "ساعات العمل" : "Hours", value: ar ? COMPANY.hours.ar : COMPANY.hours.en },
  ];

  return (
    <>
      <CenterHeader
        title={ar ? "النظام" : "System"}
        sub={ar ? "الإعدادات المركزية التي تقرأها كل واجهات المتجر." : "The central settings every store surface reads from."}
      />

      <dl className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[140px_1fr] gap-3 p-3 text-sm">
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="text-foreground" dir={r.ltr ? "ltr" : undefined}>{r.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        {ar
          ? "هذه القيم تُدار حالياً من ملف إعدادات الشركة المركزي. تعديلها هنا مباشرة سيأتي في مرحلة لاحقة."
          : "These values are currently managed in the central company configuration module. Editing them here arrives in a later phase."}
      </div>
    </>
  );
}
