import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { RegistrationRequestsPanel } from "@/components/RegistrationRequestsPanel";

export const Route = createFileRoute("/staff/resets")({
  head: () => ({
    meta: [
      { title: "استعادة كلمة المرور — خدمة العملاء ميتاكير" },
      { name: "description", content: "معالجة طلبات استعادة كلمة المرور وإرسال رمز الاستعادة عبر واتساب." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetsCenter,
});

function ResetsCenter() {
  const { user, isStaff } = useAuth();
  const { lang } = useI18n();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl text-foreground">{lang === "ar" ? "مركز استعادة كلمة المرور" : "Password Reset Center"}</h1>
        <p className="text-sm text-muted-foreground">
          {lang === "ar" ? "الموافقة، الرفض، وتوليد رمز الاستعادة وإرساله عبر واتساب." : "Approve, reject, generate and send the reset code via WhatsApp."}
        </p>
      </div>
      <RegistrationRequestsPanel enabled={!!user && isStaff} kind="reset" />
    </div>
  );
}
