// System center — company configuration plus the storefront maintenance switch.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Power, Share2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { COMPANY } from "@/lib/company";
import { CenterHeader } from "@/components/admin/ui";
import { useSiteSettings } from "@/lib/api/queries";
import { adminUpdateSiteSettings } from "@/lib/api/admin.functions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";


export const Route = createFileRoute("/admin/system")({
  head: () => ({
    meta: [
      { title: "النظام — إدارة ميتاكير" },
      { name: "description", content: "بيانات الشركة وإعدادات النظام وحالة فتح أو إغلاق المتجر." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSystem,
});

const DEFAULT_AR = "المتجر مغلق مؤقتاً، نعتذر عن الإزعاج ونعود قريباً.";
const DEFAULT_EN = "The site is currently unavailable, please try again later.";

function AdminSystem() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const qc = useQueryClient();

  const settingsQ = useSiteSettings();
  const updateFn = useServerFn(adminUpdateSiteSettings);

  const [closed, setClosed] = useState(false);
  const [msgAr, setMsgAr] = useState(DEFAULT_AR);
  const [msgEn, setMsgEn] = useState(DEFAULT_EN);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = settingsQ.data;
    if (!s) return;
    setClosed(!!s.maintenance_mode);
    setMsgAr(s.maintenance_message_ar || DEFAULT_AR);
    setMsgEn(s.maintenance_message_en || DEFAULT_EN);
  }, [settingsQ.data]);

  const persist = async (next: { maintenance_mode: boolean; maintenance_message_ar: string; maintenance_message_en: string }) => {
    setSaving(true);
    try {
      await updateFn({ data: next } as any);
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success(ar ? "تم حفظ الإعدادات" : "Settings saved");
    } catch (e: any) {
      toast.error(e?.message ?? (ar ? "تعذر الحفظ" : "Could not save"));
      setClosed(!!settingsQ.data?.maintenance_mode);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (v: boolean) => {
    setClosed(v);
    void persist({
      maintenance_mode: v,
      maintenance_message_ar: msgAr.trim() || DEFAULT_AR,
      maintenance_message_en: msgEn.trim() || DEFAULT_EN,
    });
  };

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

      <section className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-glass">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
              <Power className="h-4 w-4 text-primary" />{ar ? "حالة المتجر" : "Storefront status"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {closed
                ? (ar ? "المتجر مغلق أمام العميلات الآن. الإدارة وخدمة العملاء تعمل بشكل طبيعي." : "The store is closed to customers. Admin and staff access is unaffected.")
                : (ar ? "المتجر مفتوح ويعمل بشكل طبيعي." : "The store is open and serving customers.")}
            </p>
          </div>
          <label className="inline-flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{ar ? "إغلاق المتجر" : "Close the store"}</span>
            <Switch checked={closed} onCheckedChange={toggle} disabled={saving || settingsQ.isLoading} />
          </label>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">{ar ? "رسالة الإغلاق بالعربية" : "Closed message (Arabic)"}</Label>
            <Textarea rows={3} value={msgAr} onChange={(e) => setMsgAr(e.target.value)} maxLength={300} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">{ar ? "رسالة الإغلاق بالإنجليزية" : "Closed message (English)"}</Label>
            <Textarea rows={3} dir="ltr" value={msgEn} onChange={(e) => setMsgEn(e.target.value)} maxLength={300} />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => persist({
              maintenance_mode: closed,
              maintenance_message_ar: msgAr.trim() || DEFAULT_AR,
              maintenance_message_en: msgEn.trim() || DEFAULT_EN,
            })}
            disabled={saving}
            className="min-h-[40px] rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-50"
          >
            {saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ الرسائل" : "Save messages")}
          </button>
        </div>
      </section>

      <ContactSettings />


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
          ? "بيانات الشركة تُدار حالياً من ملف الإعدادات المركزي. تعديلها من هنا يأتي في مرحلة لاحقة."
          : "Company details are managed in the central configuration module. Editing them here arrives in a later phase."}
      </div>
    </>
  );
}

// Public contact channels shown on the storefront "Contact us" page.
function ContactSettings() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const qc = useQueryClient();
  const settingsQ = useSiteSettings();
  const updateFn = useServerFn(adminUpdateSiteSettings);

  const [wa, setWa] = useState("");
  const [fb, setFb] = useState("");
  const [ig, setIg] = useState("");
  const [tt, setTt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = settingsQ.data;
    if (!s) return;
    setWa(s.contact_whatsapp ?? "");
    setFb(s.facebook_url ?? "");
    setIg(s.instagram_url ?? "");
    setTt(s.tiktok_url ?? "");
  }, [settingsQ.data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateFn({
        data: {
          contact_whatsapp: wa.trim(),
          facebook_url: fb.trim(),
          instagram_url: ig.trim(),
          tiktok_url: tt.trim(),
        },
      } as any);
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success(ar ? "تم حفظ بيانات التواصل" : "Contact settings saved");
    } catch (err: any) {
      toast.error(err?.message ?? (ar ? "تعذر الحفظ" : "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  const fields: { label: string; value: string; set: (v: string) => void; ph: string }[] = [
    { label: ar ? "رقم واتساب" : "WhatsApp number", value: wa, set: setWa, ph: "+249..." },
    { label: "Facebook", value: fb, set: setFb, ph: "https://facebook.com/…" },
    { label: "Instagram", value: ig, set: setIg, ph: "https://instagram.com/…" },
    { label: "TikTok", value: tt, set: setTt, ph: "https://tiktok.com/@…" },
  ];

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-glass">
      <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
        <Share2 className="h-4 w-4 text-primary" />{ar ? "قنوات التواصل" : "Contact channels"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {ar ? "تظهر هذه الروابط كأزرار في صفحة تواصل معنا. اترك الحقل فارغاً لإخفاء الزر." : "These appear as buttons on the Contact us page. Leave a field empty to hide its button."}
      </p>
      <form onSubmit={save} className="mt-4 grid gap-3 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.label}>
            <Label className="mb-1.5 block text-xs text-muted-foreground">{f.label}</Label>
            <Input dir="ltr" value={f.value} placeholder={f.ph} onChange={(e) => f.set(e.target.value)} maxLength={300} />
          </div>
        ))}
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={saving || settingsQ.isLoading}
            className="min-h-[40px] rounded-full gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-50"
          >
            {saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ قنوات التواصل" : "Save contact channels")}
          </button>
        </div>
      </form>
    </section>
  );
}

