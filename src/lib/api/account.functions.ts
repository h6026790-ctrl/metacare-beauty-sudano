import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- PROFILE ----------
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const { data: addresses } = await supabase
      .from("addresses")
      .select("*, state:states(*), city:cities(*), neighborhood:neighborhoods(*)")
      .eq("profile_id", userId)
      .order("is_default", { ascending: false });
    return {
      profile,
      roles: (roles ?? []).map((r) => r.role),
      addresses: addresses ?? [],
      defaultAddress: (addresses ?? []).find((a) => a.is_default) ?? (addresses ?? [])[0] ?? null,
    };
  });

const phoneField = z
  .string()
  .trim()
  .min(6, "رقم غير صالح / Invalid phone number")
  .max(30, "رقم غير صالح / Invalid phone number")
  .regex(/^[0-9+\s-]+$/, "رقم غير صالح / Invalid phone number");

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "الاسم قصير جداً / Name is too short").max(120),
  phone: phoneField,
  whatsapp: phoneField,
});

// Identity fields (name / phone / WhatsApp) are locked after registration.
// This function no longer mutates them; it only verifies the submitted values
// still match what is stored and rejects any attempt to change them.
export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { normalizePhone } = await import("@/lib/api/phone.server");

    const { data: current } = await supabase
      .from("profiles").select("full_name, phone, whatsapp").eq("id", userId).maybeSingle();
    if (!current) throw new Error("تعذّر تحديد الحساب / Could not resolve your account");

    const locked =
      (current.full_name ?? "").trim() !== data.full_name.trim() ||
      normalizePhone(current.phone ?? "") !== normalizePhone(data.phone) ||
      normalizePhone(current.whatsapp ?? "") !== normalizePhone(data.whatsapp);

    if (locked) {
      throw new Error(
        "الاسم ورقم الجوال/واتساب لا يمكن تعديلهما بعد التسجيل، يرجى التواصل مع خدمة العملاء / Name and phone/WhatsApp cannot be changed after registration; please contact customer service",
      );
    }

    return { ok: true, phoneChanged: false };
  });

const addressSchema = z.object({
  state_id: z.string().uuid(),
  city_id: z.string().uuid(),
  neighborhood_id: z.string().uuid().optional().nullable(),
  street: z.string().min(1).max(500),
  notes: z.string().max(500).optional().nullable(),
  is_default: z.boolean().default(true),
});

export const upsertDefaultAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => addressSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (data.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("profile_id", userId);
    }
    const { data: existing } = await supabase
      .from("addresses").select("id").eq("profile_id", userId).eq("is_default", true).maybeSingle();
    if (existing) {
      const { error } = await supabase.from("addresses").update({
        state_id: data.state_id, city_id: data.city_id,
        neighborhood_id: data.neighborhood_id ?? null,
        street: data.street, notes: data.notes ?? null, is_default: true,
      }).eq("id", existing.id);
      if (error) throw error;
      return { id: existing.id };
    }
    const { data: ins, error } = await supabase.from("addresses").insert({
      profile_id: userId,
      state_id: data.state_id, city_id: data.city_id,
      neighborhood_id: data.neighborhood_id ?? null,
      street: data.street, notes: data.notes ?? null, is_default: true,
    }).select("id").single();
    if (error) throw error;
    return { id: ins.id };
  });

// ---------- PASSWORD ----------
const passwordSchema = z.object({
  current_password: z.string().min(1, "أدخلي كلمة المرور الحالية / Enter your current password"),
  new_password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل / Password must be at least 8 characters")
    .max(128),
});

export const changeMyPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => passwordSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    if (data.current_password === data.new_password) {
      throw new Error("كلمة المرور الجديدة مطابقة للحالية / The new password is the same as the current one");
    }

    const { data: profile } = await supabase.from("profiles").select("phone").eq("id", userId).maybeSingle();
    if (!profile?.phone) {
      throw new Error("تعذّر تحديد الحساب / Could not resolve your account");
    }

    const { normalizePhone, phoneToEmail } = await import("@/lib/api/phone.server");
    const email = phoneToEmail(normalizePhone(profile.phone));

    // Verify the current password with a throwaway, session-less client.
    const { createClient } = await import("@supabase/supabase-js");
    const apiKey = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const verifier = createClient(process.env["SUPABASE_URL"]!, apiKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInErr } = await verifier.auth.signInWithPassword({
      email,
      password: data.current_password,
    });
    if (signInErr) {
      throw new Error("كلمة المرور الحالية غير صحيحة / Current password is incorrect");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: data.new_password,
    });
    if (error) throw error;

    return { ok: true };
  });
