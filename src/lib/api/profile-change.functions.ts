// Profile change confirmation workflow — mirrors the manual OTP pattern used
// for registration requests.
//
//   • Customer submits a new name and/or phone from the account page →
//     a pending `profile_change_requests` row is created (no profile change).
//   • Staff review current vs requested values and approve or reject.
//   • On approval a fresh 6-digit code is minted, stored hashed, and returned
//     exactly once so the agent can forward it over WhatsApp.
//   • The customer enters the code on the account page; the change is applied
//     by `applyProfileChangeRequest` (a dedicated path — `updateMyProfile`
//     deliberately rejects any name/phone edit).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const CODE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_ATTEMPTS = 5;

function rand6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
// Same scrypt scheme used for registration OTPs / passwords.
function hashCode(code: string): string {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(code, salt, 64).toString("hex")}`;
}
function verifyCode(code: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [alg, saltHex, hashHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(code, salt, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}

async function assertStaff(ctx: any) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("admin") && !roles.includes("staff")) throw new Error("Forbidden");
}

const phoneField = z
  .string().trim().min(6).max(30)
  .regex(/^[0-9+\s-]+$/, "رقم غير صالح / Invalid phone number");

// ---------- 1) CUSTOMER: submit a change request ----------
export const submitProfileChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      full_name: z.string().trim().min(2).max(120).optional().nullable(),
      phone: phoneField.optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { normalizePhone } = await import("@/lib/api/phone.server");

    const { data: current } = await supabase
      .from("profiles").select("full_name, phone, whatsapp").eq("id", userId).maybeSingle();
    if (!current) throw new Error("تعذّر تحديد الحساب / Could not resolve your account");

    const requestedName = data.full_name?.trim() || null;
    const requestedPhone = data.phone ? normalizePhone(data.phone) : null;

    const nameChanged = !!requestedName && requestedName !== (current.full_name ?? "").trim();
    const phoneChanged = !!requestedPhone && requestedPhone !== normalizePhone(current.phone ?? "");

    if (!nameChanged && !phoneChanged) {
      throw new Error("لم يتم إدخال أي تغيير / No change was requested");
    }

    // Only one live request per customer. Status changes are system-owned,
    // so this runs with elevated privileges scoped to the caller's own rows.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("profile_change_requests")
      .update({ status: "expired" })
      .eq("profile_id", userId)
      .in("status", ["pending", "approved"]);


    const { data: row, error } = await supabase
      .from("profile_change_requests")
      .insert({
        profile_id: userId,
        current_name: current.full_name,
        requested_name: nameChanged ? requestedName : null,
        current_phone: current.phone,
        requested_phone: phoneChanged ? requestedPhone : null,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw error;
    return { requestId: row.id };
  });

// ---------- 2) CUSTOMER: read own live request ----------
export const getMyProfileChangeRequest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profile_change_requests")
      .select("id, current_name, requested_name, current_phone, requested_phone, status, expires_at, failed_attempts, reject_reason, created_at")
      .eq("profile_id", context.userId)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  });

export const cancelMyProfileChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ requestId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("profile_change_requests")
      .update({ status: "expired" })
      .eq("id", data.requestId)
      .eq("profile_id", context.userId)
      .in("status", ["pending", "approved"]);
    if (error) throw error;
    return { ok: true };
  });

// ---------- 3) CUSTOMER: confirm with the code → apply the change ----------
export const applyProfileChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ code: z.string().trim().regex(/^\d{6}$/, "رمز غير صالح / Invalid code") }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { normalizePhone, phoneToEmail } = await import("@/lib/api/phone.server");

    const { data: req } = await supabase
      .from("profile_change_requests")
      .select("*")
      .eq("profile_id", userId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!req) throw new Error("لا يوجد طلب معتمد / No approved request awaiting confirmation");

    if (!req.expires_at || new Date(req.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from("profile_change_requests").update({ status: "expired" }).eq("id", req.id);
      throw new Error("انتهت صلاحية الرمز / The code has expired");
    }

    if (!verifyCode(data.code, req.code_hash)) {
      const attempts = (req.failed_attempts ?? 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await supabaseAdmin
          .from("profile_change_requests")
          .update({ status: "expired", failed_attempts: attempts })
          .eq("id", req.id);
        throw new Error("تم تجاوز عدد المحاولات. يرجى تقديم طلب جديد. / Too many failed attempts. Please submit a new request.");
      }
      await supabaseAdmin.from("profile_change_requests").update({ failed_attempts: attempts }).eq("id", req.id);
      throw new Error(`رمز غير صحيح (${attempts}/${MAX_ATTEMPTS}) / Invalid code (${attempts}/${MAX_ATTEMPTS})`);
    }

    const updates: { full_name?: string; phone?: string; whatsapp?: string } = {};
    if (req.requested_name) updates.full_name = req.requested_name;

    let newPhone: string | null = null;
    if (req.requested_phone) {
      newPhone = normalizePhone(req.requested_phone);
      // Reject if another account already uses this number.
      const { data: clash } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("phone", newPhone)
        .neq("id", userId)
        .maybeSingle();
      if (clash) {
        throw new Error("هذا الرقم مستخدم في حساب آخر / This phone number is already used by another account");
      }
      updates.phone = newPhone;
      updates.whatsapp = newPhone;
    }

    if (newPhone) {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: phoneToEmail(newPhone),
        email_confirm: true,
      });
      if (authErr) {
        throw new Error("تعذّر تحديث بيانات الدخول بالرقم الجديد / Could not update sign-in details with the new number");
      }
    }

    const { error: profErr } = await supabaseAdmin.from("profiles").update(updates).eq("id", userId);
    if (profErr) throw profErr;

    await supabaseAdmin
      .from("profile_change_requests")
      .update({ status: "approved", code_hash: null, expires_at: null })
      .eq("id", req.id);

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      action: "profile_change.applied",
      entity_type: "profile_change_request",
      entity_id: req.id,
      metadata: {
        profile_id: userId,
        name: req.requested_name ? { from: req.current_name, to: req.requested_name } : null,
        phone: newPhone ? { from: req.current_phone, to: newPhone } : null,
      },
    });

    return { ok: true, phoneChanged: !!newPhone };
  });

// ---------- 4) STAFF/ADMIN: list requests ----------
const STATUS = z.enum(["pending", "approved", "rejected", "expired", "all"]);

export const listProfileChangeRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ status: STATUS.default("pending") }).parse(d ?? {}))
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    let q = context.supabase
      .from("profile_change_requests")
      // code_hash is never exposed; the plaintext is returned once by approve.
      .select("id, profile_id, current_name, requested_name, current_phone, requested_phone, status, failed_attempts, expires_at, reviewed_at, reject_reason, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

// ---------- 5) STAFF/ADMIN: approve (mint code) / reject / regenerate ----------
export const approveProfileChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ requestId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const code = rand6();
    const { error } = await context.supabase
      .from("profile_change_requests")
      .update({
        status: "approved",
        code_hash: hashCode(code),
        failed_attempts: 0,
        expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.requestId)
      .eq("status", "pending");
    if (error) throw error;

    await context.supabase.from("audit_logs").insert({
      actor_id: context.userId,
      action: "profile_change.approved",
      entity_type: "profile_change_request",
      entity_id: data.requestId,
      metadata: {},
    });

    return { ok: true, code };
  });

export const regenerateProfileChangeCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ requestId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const code = rand6();
    const { error } = await context.supabase
      .from("profile_change_requests")
      .update({
        status: "approved",
        code_hash: hashCode(code),
        failed_attempts: 0,
        expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.requestId)
      .in("status", ["pending", "approved", "expired"]);
    if (error) throw error;
    return { code };
  });

export const rejectProfileChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ requestId: z.string().uuid(), reason: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const { error } = await context.supabase
      .from("profile_change_requests")
      .update({
        status: "rejected",
        reject_reason: data.reason ?? null,
        code_hash: null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.requestId)
      .in("status", ["pending", "approved"]);
    if (error) throw error;

    await context.supabase.from("audit_logs").insert({
      actor_id: context.userId,
      action: "profile_change.rejected",
      entity_type: "profile_change_request",
      entity_id: data.requestId,
      metadata: { reason: data.reason ?? null },
    });

    return { ok: true };
  });
