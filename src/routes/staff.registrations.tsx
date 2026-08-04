import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { RegistrationRequestsPanel } from "@/components/RegistrationRequestsPanel";

export const Route = createFileRoute("/staff/registrations")({
  head: () => ({
    meta: [
      { title: "مركز طلبات التسجيل — خدمة العملاء ميتاكير" },
      { name: "description", content: "مراجعة طلبات تسجيل العميلات، توليد رمز التفعيل وإرساله عبر واتساب." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegistrationsCenter,
});

function RegistrationsCenter() {
  const { user, isStaff } = useAuth();
  const { lang } = useI18n();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl text-foreground">{lang === "ar" ? "مركز طلبات التسجيل" : "Registration Center"}</h1>
        <p className="text-sm text-muted-foreground">
          {lang === "ar" ? "الموافقة، الرفض، وتوليد رمز التفعيل وإرساله عبر واتساب." : "Approve, reject, generate and send the activation code via WhatsApp."}
        </p>
      </div>
      <RegistrationRequestsPanel enabled={!!user && isStaff} kind="registration" />
    </div>
  );
}
