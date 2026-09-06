import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { ProfileChangeRequestsPanel } from "@/components/ProfileChangeRequestsPanel";

export const Route = createFileRoute("/staff/profile-changes")({
  head: () => ({
    meta: [
      { title: "طلبات تعديل البيانات — خدمة العملاء ميتاكير" },
      { name: "description", content: "مراجعة طلبات تعديل الاسم ورقم الجوال، وتوليد رمز التأكيد وإرساله عبر واتساب." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfileChangesCenter,
});

function ProfileChangesCenter() {
  const { user, isStaff } = useAuth();
  const { lang } = useI18n();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl text-foreground">
          {lang === "ar" ? "طلبات تعديل البيانات" : "Profile change requests"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {lang === "ar"
            ? "قارني البيانات الحالية بالمطلوبة، ثم وافقي وأرسلي رمز التأكيد عبر واتساب."
            : "Compare current vs requested details, then approve and send the confirmation code via WhatsApp."}
        </p>
      </div>
      <ProfileChangeRequestsPanel enabled={!!user && isStaff} />
    </div>
  );
}
