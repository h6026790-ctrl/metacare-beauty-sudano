// Blocking notice for pages that belong to customer accounts only.
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/i18n/I18nProvider";

export function CustomerOnlyNotice() {
  const { lang } = useI18n();
  return (
    <AppShell>
      <div className="p-16 text-center text-muted-foreground">
        {lang === "ar" ? "هذه الصفحة مخصصة لحسابات العميلات فقط" : "This page is for customer accounts only"}
        <div className="mt-4">
          <Link to="/" className="text-primary hover:underline">
            {lang === "ar" ? "العودة للرئيسية" : "Back home"}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
