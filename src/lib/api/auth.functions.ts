// Manual OTP registration / sign-in workflow.
// No SMS / Twilio. CS staff reads the OTP from the dashboard and sends it
// to the customer over WhatsApp. The customer enters it on the site, which
// activates the account and returns a one-time email/password the client
// uses to obtain a Supabase session.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- helpers ----------
function normalizePhone(input: string): string {
  let p = (input || "").trim().replace(/\s+/g, "");
  if (p.startsWith("+")) return p;
  if (p.startsWith("00")) return "+" + p.slice(2);
  if (p.startsWith("0")) return "+249" + p.slice(1);
  if (p.startsWith("249")) return "+" + p;
  return "+249" + p;
}
function phoneToEmail(phone: string) {
  // synthetic, never delivered to a real inbox
  return `${phone.replace(/[^0-9]/g, "")}@phone.metacare.local`;
}
function rand6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function randPassword() {
  return (
    "Mc-" +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10).toUpperCase() +
    "!" +
    Math.floor(Math.random() * 1000)
  );
}

// ---------- 1) PUBLIC: submit registration / sign-in request ----------
const submitSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  whatsapp: z.string().trim().min(6).max(30),
  street: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  state_id: z.string().uuid().optional().nullable(),
  city_id: z.string().uuid().optional().nullable(),
  neighborhood_id: z.string().uuid().optional().nullable(),
  request_type: z.enum(["register", "login"]).default("register"),
});

export const submitRegistrationRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const phone = normalizePhone(data.phone);
    const whatsapp = normalizePhone(data.whatsapp || data.phone);
    const otp = rand6();

    // Expire any earlier pending requests for the same phone.
    await supabaseAdmin
      .from("registration_requests")
      .update({ status: "expired" })
      .eq("phone", phone)
      .in("status", ["pending", "approved"]);

    const { data: row, error } = await supabaseAdmin
      .from("registration_requests")
      .insert({
        full_name: data.full_name.trim(),
        phone,
        whatsapp,
        street: data.street ?? null,
        notes: data.notes ?? null,
        address_state_id: data.state_id ?? null,
        address_city_id: data.city_id ?? null,
        address_neighborhood_id: data.neighborhood_id ?? null,
        otp_code: otp,
        status: "pending",
        request_type: data.request_type,
      })
      .select("id, phone")
      .single();
    if (error) throw error;
    return { requestId: row.id, phone: row.phone };
  });

// ---------- 2) PUBLIC: verify OTP & obtain credentials ----------
const verifySchema = z.object({
  phone: z.string().trim().min(6).max(30),
  otp: z.string().trim().regex(/^\d{6}$/),
});

export const verifyRegistrationOtp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => verifySchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const phone = normalizePhone(data.phone);

    const { data: req, error: reqErr } = await supabaseAdmin
      .from("registration_requests")
      .select("*")
      .eq("phone", phone)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (reqErr) throw reqErr;
    if (!req) throw new Error("لا يوجد طلب نشط / No active request");
    if (new Date(req.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from("registration_requests").update({ status: "expired" }).eq("id", req.id);
      throw new Error("انتهت صلاحية الرمز / Code expired");
    }
    if (req.status !== "approved") {
      throw new Error("بانتظار موافقة خدمة العملاء / Awaiting Customer Service approval");
    }
    if (req.otp_code !== data.otp) throw new Error("رمز غير صحيح / Invalid code");

    // Find or create the auth user keyed by synthetic email.
    const email = phoneToEmail(phone);
    const password = randPassword();

    let userId: string | null = null;
    // Try to find by listing users filtered by email (admin endpoint).
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u: any) => u.email === email);

    if (existing) {
      userId = existing.id;
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: {
          ...(existing.user_metadata ?? {}),
          full_name: req.full_name,
          phone,
          whatsapp: req.whatsapp,
        },
      });
      if (updErr) throw updErr;
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: req.full_name, phone, whatsapp: req.whatsapp },
      });
      if (createErr) throw createErr;
      userId = created.user!.id;
    }

    // Make sure profile is up to date (handle_new_user trigger covers insert).
    await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: userId!, full_name: req.full_name, phone, whatsapp: req.whatsapp },
        { onConflict: "id" },
      );

    // Mark request verified
    await supabaseAdmin
      .from("registration_requests")
      .update({ status: "verified", verified_at: new Date().toISOString(), user_id: userId })
      .eq("id", req.id);

    return { email, password };
  });

// ---------- 3) STAFF/ADMIN: list requests ----------
async function assertStaff(ctx: any) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("admin") && !roles.includes("staff")) throw new Error("Forbidden");
}

export const listRegistrationRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ status: z.enum(["pending", "approved", "rejected", "verified", "expired", "all"]).default("pending") })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    let q = context.supabase
      .from("registration_requests")
      .select(
        "id, full_name, phone, whatsapp, street, notes, otp_code, status, request_type, created_at, expires_at, approved_at, verified_at, rejected_at, reject_reason, address_state:states(name_ar,name_en), address_city:cities(name_ar,name_en), address_neighborhood:neighborhoods(name_ar,name_en)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

// ---------- 4) STAFF/ADMIN: approve / reject ----------
export const approveRegistrationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ requestId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const { error } = await context.supabase
      .from("registration_requests")
      .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: context.userId })
      .eq("id", data.requestId)
      .eq("status", "pending");
    if (error) throw error;
    return { ok: true };
  });

export const rejectRegistrationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ requestId: z.string().uuid(), reason: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const { error } = await context.supabase
      .from("registration_requests")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
        rejected_by: context.userId,
        reject_reason: data.reason ?? null,
      })
      .eq("id", data.requestId)
      .in("status", ["pending", "approved"]);
    if (error) throw error;
    return { ok: true };
  });

// ---------- 5) STAFF/ADMIN: regenerate OTP (in case the original was leaked) ----------
export const regenerateRegistrationOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ requestId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const otp = rand6();
    const { error } = await context.supabase
      .from("registration_requests")
      .update({ otp_code: otp, status: "pending", expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString() })
      .eq("id", data.requestId)
      .in("status", ["pending", "approved", "expired"]);
    if (error) throw error;
    return { otp };
  });
