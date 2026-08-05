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

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { normalizePhone, phoneToEmail } = await import("@/lib/api/phone.server");
    const newPhone = normalizePhone(data.phone);
    const newWhatsapp = normalizePhone(data.whatsapp);

    const { data: current } = await supabase.from("profiles").select("phone").eq("id", userId).maybeSingle();
    const currentPhone = current?.phone ? normalizePhone(current.phone) : null;

    // Phone is the login identity: keep auth.users in sync with the profile.
    if (currentPhone !== newPhone) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const email = phoneToEmail(newPhone);

      const perPage = 200;
      let taken: any = null;
      for (let page = 1; page <= 100; page++) {
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
        if (listErr) throw listErr;
        const users = list?.users ?? [];
        const hit = users.find((u: any) => u.email === email);
        if (hit) { taken = hit; break; }
        if (users.length < perPage) break;
      }
      if (taken && taken.id !== userId) {
        throw new Error("هذا الرقم مستخدم في حساب آخر / This phone number is already used by another account");
      }

      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email,
        email_confirm: true,
        user_metadata: { full_name: data.full_name, phone: newPhone, whatsapp: newWhatsapp },
      });
      if (authErr) throw authErr;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: data.full_name, phone: newPhone, whatsapp: newWhatsapp })
      .eq("id", userId);
    if (error) throw error;
    return { ok: true, phoneChanged: currentPhone !== newPhone };
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
