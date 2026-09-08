// Profile change requests panel — mirrors RegistrationRequestsPanel.
// Shows current vs requested name/phone, with approve / reject / regenerate
// and a one-time confirmation code to forward over WhatsApp.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listProfileChangeRequests,
  approveProfileChangeRequest,
  rejectProfileChangeRequest,
  regenerateProfileChangeCode,
} from "@/lib/api/profile-change.functions";
import { useI18n } from "@/i18n/I18nProvider";
import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Copy, RefreshCw, Check, X, ArrowRight } from "lucide-react";
import { whatsappLink } from "@/lib/format";

const STATUSES = ["pending", "approved", "applied", "rejected", "expired", "cancelled", "archived", "all"] as const;
type Status = typeof STATUSES[number];

export function ProfileChangeRequestsPanel({ enabled = true }: { enabled?: boolean }) {
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("pending");
  // Codes are stored hashed; plaintext is returned once and kept in memory.
  const [codes, setCodes] = useState<Record<string, string>>({});

  const listFn = useServerFn(listProfileChangeRequests);
  const approveFn = useServerFn(approveProfileChangeRequest);
  const rejectFn = useServerFn(rejectProfileChangeRequest);
  const regenFn = useServerFn(regenerateProfileChangeCode);

  const q = useQuery({
    queryKey: ["profile-change-requests", status],
    queryFn: () => listFn({ data: { status } } as any),
    enabled,
    refetchInterval: 15_000,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["profile-change-requests"] });

  const approve = useMutation({
    mutationFn: async (id: string) => ({ id, res: (await approveFn({ data: { requestId: id } })) as any }),
    onSuccess: ({ id, res }) => {
      if (res?.code) setCodes((c) => ({ ...c, [id]: res.code }));
      toast.success(lang === "ar" ? "تمت الموافقة — الرمز ظاهر الآن" : "Approved — code shown now");
      refresh();
    },
    onError: (e: any) => toast.error(e.message),
  });
  const reject = useMutation({
    mutationFn: (id: string) => rejectFn({ data: { requestId: id } }),
    onSuccess: () => { toast.success(lang === "ar" ? "تم الرفض" : "Rejected"); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });
  const regen = useMutation({
    mutationFn: async (id: string) => ({ id, res: (await regenFn({ data: { requestId: id } })) as any }),
    onSuccess: ({ id, res }) => {
      if (res?.code) setCodes((c) => ({ ...c, [id]: res.code }));
      toast.success(lang === "ar" ? "تم توليد رمز جديد" : "New code generated");
      refresh();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = (q.data ?? []) as any[];

  const copyCode = async (code: string) => {
    try { await navigator.clipboard.writeText(code); toast.success(lang === "ar" ? "تم النسخ" : "Copied"); } catch {}
  };

  const buildWaMsg = (r: any, code: string) =>
    lang === "ar"
      ? `مرحباً ${r.current_name ?? ""}، رمز تأكيد تعديل بياناتكِ في ميتاكير هو: ${code} (صالح لمدة 30 دقيقة)`
      : `Hello ${r.current_name ?? ""}, your Metacare profile update confirmation code is: ${code} (valid for 30 minutes)`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {labelFor(s, lang)}
          </button>
        ))}
        <span className="ms-auto text-xs text-muted-foreground">
          {rows.length} {lang === "ar" ? "طلب" : "requests"}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          {lang === "ar" ? "لا توجد طلبات" : "No requests"}
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-glass">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-base text-foreground">{r.current_name || "—"}</p>
                    <StatusBadge status={r.status} />
                  </div>

                  {r.requested_name && (
                    <DiffRow
                      label={lang === "ar" ? "الاسم" : "Name"}
                      from={r.current_name}
                      to={r.requested_name}
                    />
                  )}
                  {r.requested_phone && (
                    <DiffRow
                      label={lang === "ar" ? "رقم الجوال / واتساب" : "Phone / WhatsApp"}
                      from={r.current_phone}
                      to={r.requested_phone}
                      ltr
                    />
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {lang === "ar" ? "الرمز" : "Code"}
                  </span>
                  {codes[r.id] ? (
                    <>
                      <span dir="ltr" className="font-mono text-2xl font-semibold tracking-[0.3em] text-primary">
                        {codes[r.id]}
                      </span>
                      <button
                        onClick={() => copyCode(codes[r.id]!)}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
                        title={lang === "ar" ? "نسخ" : "Copy"}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="max-w-[14rem] text-[11px] leading-snug text-muted-foreground">
                      {r.status === "pending"
                        ? (lang === "ar"
                            ? "لم يُنشأ رمز بعد — يُنشأ عند الموافقة ويُعرض مرة واحدة"
                            : "No code yet — one is created on approval and shown once")
                        : (lang === "ar"
                            ? "الرمز محفوظ مشفّراً — اضغطي رمز جديد لعرضه مرة واحدة"
                            : "Code is stored hashed — regenerate to reveal a new one once")}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {codes[r.id] && (
                  <a
                    href={whatsappLink(r.current_phone ?? "", buildWaMsg(r, codes[r.id]!))}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-xs font-medium text-success-foreground"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {lang === "ar" ? "إرسال عبر واتساب" : "Send via WhatsApp"}
                  </a>
                )}

                {r.status === "pending" && (
                  <button
                    onClick={() => approve.mutate(r.id)}
                    disabled={approve.isPending}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {lang === "ar" ? "موافقة" : "Approve"}
                  </button>
                )}
                {(r.status === "pending" || r.status === "approved") && (
                  <>
                    <button
                      onClick={() => reject.mutate(r.id)}
                      disabled={reject.isPending}
                      className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>{lang === "ar" ? "رفض" : "Reject"}</span>
                    </button>
                    <button
                      onClick={() => regen.mutate(r.id)}
                      disabled={regen.isPending}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-60"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {lang === "ar" ? "رمز جديد" : "Regenerate"}
                    </button>
                  </>
                )}

                <span className="ms-auto text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}
                </span>
              </div>
              {r.reject_reason && <p className="mt-2 text-xs text-destructive">{r.reject_reason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiffRow({ label, from, to, ltr }: { label: string; from?: string | null; to?: string | null; ltr?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className="rounded-md bg-muted px-2 py-0.5 text-foreground/70 line-through" dir={ltr ? "ltr" : undefined}>
        {from || "—"}
      </span>
      <ArrowRight className="h-3 w-3 text-muted-foreground rtl:rotate-180" />
      <span className="rounded-md bg-primary px-2 py-0.5 font-medium text-primary-foreground" dir={ltr ? "ltr" : undefined}>
        {to || "—"}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { lang } = useI18n();
  const map: Record<string, string> = {
    pending: "bg-warning text-warning-foreground",
    approved: "bg-primary text-primary-foreground",
    applied: "bg-success text-success-foreground",
    rejected: "bg-destructive text-destructive-foreground",
    expired: "bg-muted text-muted-foreground",
    cancelled: "bg-muted text-muted-foreground",
  };
  const ar: Record<string, string> = { pending: "بانتظار الموافقة", approved: "بانتظار إدخال العميلة", applied: "تم التنفيذ", rejected: "مرفوض", expired: "منتهي", cancelled: "ملغى" };
  const en: Record<string, string> = { pending: "Pending", approved: "Awaiting customer", applied: "Applied", rejected: "Rejected", expired: "Expired", cancelled: "Cancelled" };
  const label = (lang === "ar" ? ar[status] : en[status]) ?? status;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wider ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {label}
    </span>
  );
}

function labelFor(s: Status, lang: "ar" | "en") {
  const ar: Record<Status, string> = { pending: "بانتظار الموافقة", approved: "بانتظار إدخال العميلة", applied: "تم التنفيذ", rejected: "مرفوض", expired: "منتهي", cancelled: "ملغى", archived: "المؤرشفة", all: "الكل" };
  const en: Record<Status, string> = { pending: "Pending", approved: "Awaiting customer", applied: "Applied", rejected: "Rejected", expired: "Expired", cancelled: "Cancelled", archived: "Archived", all: "All" };
  return (lang === "ar" ? ar : en)[s];
}
