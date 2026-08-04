// Shared Registration Requests panel — visible inside Admin and Staff dashboards.
// Shows pending OTP requests with the generated code so staff can send it
// to the customer manually over WhatsApp.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listRegistrationRequests,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  regenerateRegistrationOtp,
} from "@/lib/api/auth.functions";
import { useI18n } from "@/i18n/I18nProvider";
import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Copy, RefreshCw, Check, X } from "lucide-react";
import { whatsappLink } from "@/lib/format";

const STATUSES = ["pending", "approved", "verified", "rejected", "expired", "all"] as const;
type Status = typeof STATUSES[number];

export function RegistrationRequestsPanel({ enabled = true, kind }: { enabled?: boolean; kind?: "registration" | "reset" }) {
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("pending");
  // OTPs are stored hashed; the plaintext is returned once by approve/regenerate
  // and kept in memory only for this session.
  const [codes, setCodes] = useState<Record<string, string>>({});

  const listFn = useServerFn(listRegistrationRequests);
  const approveFn = useServerFn(approveRegistrationRequest);
  const rejectFn = useServerFn(rejectRegistrationRequest);
  const regenFn = useServerFn(regenerateRegistrationOtp);

  const q = useQuery({
    queryKey: ["registration-requests", status],
    queryFn: () => listFn({ data: { status } } as any),
    enabled,
    refetchInterval: 15_000,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["registration-requests"] });

  const approve = useMutation({
    mutationFn: async (id: string) => ({ id, res: (await approveFn({ data: { requestId: id } })) as any }),
    onSuccess: ({ id, res }) => {
      if (res?.otp) setCodes((c) => ({ ...c, [id]: res.otp }));
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
      if (res?.otp) setCodes((c) => ({ ...c, [id]: res.otp }));
      toast.success(lang === "ar" ? "تم توليد رمز جديد" : "New code generated");
      refresh();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const allRows = (q.data ?? []) as any[];
  const rows = kind
    ? allRows.filter((r) => {
        const isReset = String(r?.request_type ?? "").includes("reset");
        return kind === "reset" ? isReset : !isReset;
      })
    : allRows;

  const copyOtp = async (otp: string) => {
    try { await navigator.clipboard.writeText(otp); toast.success(lang === "ar" ? "تم النسخ" : "Copied"); } catch {}
  };

  const buildWaMsg = (r: any, otp: string) =>
    lang === "ar"
      ? `مرحباً ${r.full_name}، رمز التحقق الخاص بكِ في ميتاكير: ${otp}\nأدخليه على الموقع لتفعيل حسابكِ.`
      : `Hello ${r.full_name}, your Metacare verification code is: ${otp}\nEnter it on the website to activate your account.`;


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
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-base text-foreground">{r.full_name}</p>
                    <StatusBadge status={r.status} />
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {r.request_type}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                    {r.phone} · WA: {r.whatsapp}
                  </p>
                  {(r.address_state || r.address_city || r.street) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[
                        r.address_state ? (lang === "ar" ? r.address_state.name_ar : r.address_state.name_en) : null,
                        r.address_city ? (lang === "ar" ? r.address_city.name_ar : r.address_city.name_en) : null,
                        r.address_neighborhood ? (lang === "ar" ? r.address_neighborhood.name_ar : r.address_neighborhood.name_en) : null,
                        r.street,
                      ].filter(Boolean).join(" • ")}
                    </p>
                  )}
                  {r.notes && <p className="mt-1 text-xs italic text-muted-foreground">"{r.notes}"</p>}
                </div>

                <div className="flex shrink-0 items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {lang === "ar" ? "الرمز" : "OTP"}
                  </span>
                  {codes[r.id] ? (
                    <>
                      <span dir="ltr" className="font-mono text-2xl font-semibold tracking-[0.3em] text-primary">
                        {codes[r.id]}
                      </span>
                      <button
                        onClick={() => copyOtp(codes[r.id]!)}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
                        title={lang === "ar" ? "نسخ" : "Copy"}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="max-w-[14rem] text-[11px] leading-snug text-muted-foreground">
                      {lang === "ar"
                        ? "الرمز محفوظ مشفّراً — اضغطي موافقة أو رمز جديد لعرضه مرة واحدة"
                        : "Code is stored hashed — approve or regenerate to reveal it once"}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {codes[r.id] && (
                  <a
                    href={whatsappLink(r.whatsapp, buildWaMsg(r, codes[r.id]!))}
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
                  <button
                    onClick={() => reject.mutate(r.id)}
                    disabled={reject.isPending}
                    className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" />
                    {lang === "ar" ? "رفض" : "Reject"}
                  </button>
                )}
                <button
                  onClick={() => regen.mutate(r.id)}
                  disabled={regen.isPending}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-60"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {lang === "ar" ? "رمز جديد" : "Regenerate"}
                </button>

                <span className="ms-auto text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}
                </span>
              </div>
              {r.reject_reason && (
                <p className="mt-2 text-xs text-destructive">{r.reject_reason}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning",
    approved: "bg-primary/15 text-primary",
    verified: "bg-success/15 text-success",
    rejected: "bg-destructive/15 text-destructive",
    expired: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${map[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}

function labelFor(s: Status, lang: "ar" | "en") {
  const ar: Record<Status, string> = { pending: "بانتظار الموافقة", approved: "تمت الموافقة", verified: "مفعّل", rejected: "مرفوض", expired: "منتهي", all: "الكل" };
  const en: Record<Status, string> = { pending: "Pending", approved: "Approved", verified: "Verified", rejected: "Rejected", expired: "Expired", all: "All" };
  return (lang === "ar" ? ar : en)[s];
}
