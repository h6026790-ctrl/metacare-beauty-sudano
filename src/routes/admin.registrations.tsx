// Registrations center — reuses the shared requests panel.
import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { CenterHeader } from "@/components/admin/ui";
import { RegistrationRequestsPanel } from "@/components/RegistrationRequestsPanel";

export const Route = createFileRoute("/admin/registrations")({
  head: () => ({
    meta: [
      { title: "طلبات التسجيل — إدارة ميتاكير" },
      { name: "description", content: "مراجعة طلبات فتح الحسابات واستعادة كلمات المرور." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminRegistrations,
});

function AdminRegistrations() {
  const { lang } = useI18n();
  const { user, isAdmin } = useAuth();

  return (
    <>
      <CenterHeader
        title={lang === "ar" ? "طلبات التسجيل" : "Registrations"}
        sub={lang === "ar" ? "الطلبات التي تنتظر موافقة أو رمز تحقق." : "Requests awaiting approval or a verification code."}
      />
      <RegistrationRequestsPanel enabled={!!user && isAdmin} />
    </>
  );
}
