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

const profileSchema = z.object({
  full_name: z.string().min(1).max(120),
  phone: z.string().min(6).max(30),
  whatsapp: z.string().min(6).max(30),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: data.full_name, phone: data.phone, whatsapp: data.whatsapp })
      .eq("id", userId);
    if (error) throw error;
    return { ok: true };
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
