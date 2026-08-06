// Manual OTP workflow — used ONLY for first-time account activation and
// for password resets. Normal login is phone + password directly against
// Supabase Auth (no OTP).
//
// Flow summary:
//   • Registration: customer submits full info + password → request stored
//     (password_hash only). CS approves → OTP shown → customer verifies +
//     re-enters password → auth user created with that password.
//   • Password reset: customer submits phone + new password → request
//     stored (request_type='reset', password_hash only, must match an
//     existing user). CS approves → OTP shown → customer verifies +
//     re-enters password → auth user password updated.
//   • Login: phone + password only, handled client-side via
//     supabase.auth.signInWithPassword using the synthetic phone email.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

// ---------- helpers ----------
function normalizePhone(input: string): string {
  let p = (input || "").trim().replace(/\s+/g, "");
  if (p.startsWith("+")) return p;
  if (p.startsWith("00")) return "+" + p.slice(2);
  if (p.startsWith("0")) return "+249" + p.slice(1);
  if (p.startsWith("249")) return "+" + p;
  return "+249" + p;
}
export function phoneToEmail(phone: string) {
  // synthetic, never delivered to a real inbox
  return `${phone.replace(/[^0-9]/g, "")}@phone.metacare.local`;
}
function rand6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
function verifyPassword(pw: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [alg, saltHex, hashHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(pw, salt, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}
// OTP codes are stored hashed with the same scheme as passwords.
const hashOtp = hashPassword;
const verifyOtp = verifyPassword;

const MAX_OTP_ATTEMPTS = 5;

// Look the account up by its normalized phone number via public.profiles
// (indexed) instead of paging through every auth user. The page-walk stays
// only as a fallback for accounts that predate a profile row.
async function findUserByPhone(supabaseAdmin: any, phone: string) {
  const email = phoneToEmail(phone);
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  if (profile?.id) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (!error && data?.user) return data.user;
  }
  const perPage = 200;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const hit = users.find((u: any) => u.email === email);
    if (hit) return hit;
    if (users.length < perPage) return null;
  }
  return null;
}



// ---------- 1) PUBLIC: submit registration ----------
const submitSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  whatsapp: z.string().trim().min(6).max(30),
  password: z.string().min(8).max(128),
  street: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  state_id: z.string().uuid().optional().nullable(),
  city_id: z.string().uuid().optional().nullable(),
  neighborhood_id: z.string().uuid().optional().nullable(),
});

export const submitRegistrationRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const phone = normalizePhone(data.phone);
    const whatsapp = normalizePhone(data.whatsapp || data.phone);

    await enforceRateLimit(supabaseAdmin, `register:${phone}`, RATE_LIMITS.register);

    // Refuse if a verified auth user already exists for this phone.
    const existing = await findUserByPhone(supabaseAdmin, phone);
    if (existing) {
      throw new Error(
        "يوجد حساب مسجل بهذا الرقم. استخدمي تسجيل الدخول أو استعادة كلمة المرور. / An account already exists for this phone. Please sign in or use password reset.",
      );
    }

    const otp = rand6();

    // Expire any earlier pending register requests for the same phone.
    await supabaseAdmin
      .from("registration_requests")
      .update({ status: "expired" })
      .eq("phone", phone)
      .eq("request_type", "register")
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
        otp_code: hashOtp(otp),
        password_hash: hashPassword(data.password),
        status: "pending",
        request_type: "register",
      })
      .select("id, phone")
      .single();
    if (error) throw error;
    return { requestId: row.id, phone: row.phone };
  });

// ---------- 2) PUBLIC: submit password-reset request ----------
const resetSchema = z.object({
  phone: z.string().trim().min(6).max(30),
  password: z.string().min(8).max(128),
});

export const submitPasswordResetRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => resetSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const phone = normalizePhone(data.phone);

    await enforceRateLimit(supabaseAdmin, `reset:${phone}`, RATE_LIMITS.reset);

    const existing = await findUserByPhone(supabaseAdmin, phone);

    // Anti-enumeration: an unknown phone gets the same success-shaped answer
    // as a known one. The real outcome is recorded in audit_logs instead.
    if (!existing) {
      await supabaseAdmin.from("audit_logs").insert({
        action: "registration.reset_requested_unknown_phone",
        entity_type: "registration_request",
        entity_id: null,
        metadata: { phone },
      });
      return { requestId: null, phone };
    }

    // Expire any earlier pending reset requests for the same phone.
    await supabaseAdmin
      .from("registration_requests")
      .update({ status: "expired" })
      .eq("phone", phone)
      .eq("request_type", "reset")
      .in("status", ["pending", "approved"]);

    const otp = rand6();
    const { data: row, error } = await supabaseAdmin
      .from("registration_requests")
      .insert({
        full_name: (existing.user_metadata as any)?.full_name || "—",
        phone,
        whatsapp: (existing.user_metadata as any)?.whatsapp || phone,
        otp_code: hashOtp(otp),
        password_hash: hashPassword(data.password),
        status: "pending",
        request_type: "reset",
      })
      .select("id, phone")
      .single();
    if (error) throw error;
    return { requestId: row.id as string | null, phone: row.phone };
  });


// ---------- 3) PUBLIC: verify OTP (register or reset) ----------
const verifySchema = z.object({
  phone: z.string().trim().min(6).max(30),
  otp: z.string().trim().regex(/^\d{6}$/),
  password: z.string().min(8).max(128),
  request_type: z.enum(["register", "reset"]).default("register"),
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
      .eq("request_type", data.request_type)
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
    if (!verifyOtp(data.otp, req.otp_code)) {
      const attempts = (req.failed_attempts ?? 0) + 1;
      if (attempts >= MAX_OTP_ATTEMPTS) {
        await supabaseAdmin
          .from("registration_requests")
          .update({ status: "expired", failed_attempts: attempts })
          .eq("id", req.id);
        throw new Error(
          "تم تجاوز عدد المحاولات المسموح بها. يرجى تقديم طلب جديد. / Too many failed attempts. Please submit a new request.",
        );
      }
      await supabaseAdmin
        .from("registration_requests")
        .update({ failed_attempts: attempts })
        .eq("id", req.id);
      throw new Error(
        `رمز غير صحيح (${attempts}/${MAX_OTP_ATTEMPTS}) / Invalid code (${attempts}/${MAX_OTP_ATTEMPTS})`,
      );
    }
    if (!verifyPassword(data.password, req.password_hash)) {
      throw new Error("كلمة المرور لا تطابق التي أدخلتِها في الطلب / Password does not match the one submitted with the request");
    }

    const email = phoneToEmail(phone);
    const existing = await findUserByPhone(supabaseAdmin, phone);


    let userId: string | null = null;
    if (data.request_type === "register") {
      if (existing) {
        // Safety: shouldn't happen because submit blocks it, but keep account intact.
        throw new Error("يوجد حساب بهذا الرقم مسبقاً / Account already exists");
      }
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: req.full_name, phone, whatsapp: req.whatsapp },
      });
      if (createErr) throw createErr;
      userId = created.user!.id;
    } else {
      if (!existing) throw new Error("لا يوجد حساب / No account");
      userId = existing.id;
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: data.password,
        email_confirm: true,
      });
      if (updErr) throw updErr;
    }

    await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: userId!, full_name: req.full_name, phone, whatsapp: req.whatsapp },
        { onConflict: "id" },
      );

    await supabaseAdmin
      .from("registration_requests")
      .update({
        status: "verified",
        verified_at: new Date().toISOString(),
        user_id: userId,
        password_hash: null, // clear stored hash after use
      })
      .eq("id", req.id);

    return { email };
  });

// ---------- 4) STAFF/ADMIN: list requests ----------
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
        // otp_code is stored hashed and never exposed; the plaintext code is
        // returned once by approve/regenerate.
        "id, full_name, phone, whatsapp, street, notes, status, request_type, failed_attempts, created_at, expires_at, approved_at, verified_at, rejected_at, reject_reason, address_state:states(name_ar,name_en), address_city:cities(name_ar,name_en), address_neighborhood:neighborhoods(name_ar,name_en)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

// ---------- 5) STAFF/ADMIN: approve / reject ----------
export const approveRegistrationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ requestId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    // A fresh code is minted on approval and returned exactly once so the
    // agent can forward it over WhatsApp. Only its hash is persisted.
    const otp = rand6();
    const { error } = await context.supabase
      .from("registration_requests")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: context.userId,
        otp_code: hashOtp(otp),
        failed_attempts: 0,
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      })
      .eq("id", data.requestId)
      .eq("status", "pending");
    if (error) throw error;
    return { ok: true, otp };
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

// ---------- 6) STAFF/ADMIN: regenerate OTP ----------
export const regenerateRegistrationOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ requestId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const otp = rand6();
    const { error } = await context.supabase
      .from("registration_requests")
      .update({
        otp_code: hashOtp(otp),
        status: "pending",
        failed_attempts: 0,
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      })
      .eq("id", data.requestId)
      .in("status", ["pending", "approved", "expired"]);
    if (error) throw error;
    return { otp };
  });
