// Admin-only server functions. Soft-delete is mandatory — products are never
// physically removed. Inventory, role, brand/category, audit, and reports
// helpers re-export from ops.functions.ts to provide a single admin entry
// point for the dashboard layer.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export {
  adminListAllOrders,
  adminListProducts,
  adminUpsertProduct,
  adminAdjustStock,
  adminSetUserRole,
  adminListAuditLogs,
  adminListCustomers,
  adminListBrands,
  adminUpsertBrand,
  adminUpsertCategory,
} from "./ops.functions";

async function assertAdmin(ctx: any) {
  const { data } = await ctx.supabase
    .from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("admin")) throw new Error("Forbidden");
}

// ---------- SOFT DELETE / RESTORE (products are never hard-deleted) ----------
export const adminSoftDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string }) =>
    z.object({ productId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("products").update({ is_active: false }).eq("id", data.productId);
    if (error) throw error;
    // audit_product_change trigger writes the audit row automatically.
    return { ok: true };
  });

export const adminRestoreProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string }) =>
    z.object({ productId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("products").update({ is_active: true }).eq("id", data.productId);
    if (error) throw error;
    return { ok: true };
  });

// ---------- REPORTS (admin dashboard KPIs) ----------
export const adminReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await context.supabase
      .from("orders")
      .select("id, status, total_sdg, placed_at")
      .gte("placed_at", since);

    const byStatus: Record<string, number> = {};
    let revenue30d = 0;
    let orders30d = 0;
    for (const o of recent ?? []) {
      const s = (o as any).status as string;
      byStatus[s] = (byStatus[s] ?? 0) + 1;
      orders30d += 1;
      if (s === "paid" || s === "shipping" || s === "delivered") {
        revenue30d += Number((o as any).total_sdg ?? 0);
      }
    }

    const { count: customersCount } = await context.supabase
      .from("profiles").select("*", { count: "exact", head: true });
    const { count: activeProducts } = await context.supabase
      .from("products").select("*", { count: "exact", head: true }).eq("is_active", true);
    const { count: archivedProducts } = await context.supabase
      .from("products").select("*", { count: "exact", head: true }).eq("is_active", false);
    const { data: lowStock } = await context.supabase
      .from("inventory")
      .select("product_id, stock, product:products(name_ar, name_en, is_active)")
      .lte("stock", 3).order("stock", { ascending: true }).limit(20);

    return {
      revenue30d,
      orders30d,
      byStatus,
      customersCount: customersCount ?? 0,
      activeProducts: activeProducts ?? 0,
      archivedProducts: archivedProducts ?? 0,
      lowStock: lowStock ?? [],
    };
  });

// ---------- STAFF ACCOUNT MANAGEMENT (admin only) ----------
// Staff accounts are created manually with a strong random password that is
// returned exactly once to the creating admin and never stored in plain text.
export const adminCreateStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { full_name: string; phone: string }) =>
    z.object({
      full_name: z.string().trim().min(2).max(120),
      phone: z.string().trim().min(6).max(30),
    }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { normalizePhone, phoneToEmail } = await import("./phone.server");
    const { randomBytes } = await import("node:crypto");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const phone = normalizePhone(data.phone);
    const email = phoneToEmail(phone);
    const password = randomBytes(15).toString("base64url");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name,
        phone,
        whatsapp: phone,
        skip_customer_role: true,
      },
    });
    if (error) throw new Error(error.message);
    const userId = created.user!.id;

    // Single role per user — staff only, never customer.
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "staff" }, { onConflict: "user_id" });
    if (roleErr) throw roleErr;

    await supabaseAdmin.from("profiles").upsert({
      id: userId, full_name: data.full_name, phone, whatsapp: phone,
    });

    await context.supabase.from("audit_logs").insert({
      actor_id: context.userId,
      action: "admin.staff_created",
      entity_type: "user", entity_id: userId, metadata: { phone },
    });

    // Password is shown once to the admin, then irrecoverable.
    return { userId, phone, password };
  });

export const adminDeleteStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: roleRow } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", data.userId).maybeSingle();
    if (!roleRow || (roleRow.role !== "staff" && roleRow.role !== "admin")) {
      throw new Error("Not a team account");
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    await context.supabase.from("audit_logs").insert({
      actor_id: context.userId,
      action: "admin.staff_deleted",
      entity_type: "user", entity_id: data.userId, metadata: {},
    });
    return { ok: true };
  });

// ---------- PROMOTIONS: PICK OF THE DAY & FEATURED OFFERS ----------
// Only one product may carry `is_pick_of_day` at a time (enforced by a partial
// unique index), so the previous pick is always cleared first.
export const adminSetPickOfDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string | null }) =>
    z.object({ productId: z.string().uuid().nullable() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error: clearErr } = await context.supabase
      .from("products").update({ is_pick_of_day: false }).eq("is_pick_of_day", true);
    if (clearErr) throw clearErr;
    if (data.productId) {
      const { error } = await context.supabase
        .from("products").update({ is_pick_of_day: true }).eq("id", data.productId);
      if (error) throw error;
    }
    await context.supabase.from("audit_logs").insert({
      actor_id: context.userId, action: "admin.pick_of_day_set",
      entity_type: "product", entity_id: data.productId, metadata: {},
    });
    return { ok: true };
  });

export const adminSetProductFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    productId: z.string().uuid(),
    is_featured: z.boolean().optional(),
    is_new: z.boolean().optional(),
    is_best_seller: z.boolean().optional(),
    is_on_sale: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { productId, ...flags } = data;
    if (Object.keys(flags).length === 0) return { ok: true };

    // "On sale" only means something when there is a higher compare-at price
    // to strike through; otherwise the badge shows with no visible discount.
    if (flags.is_on_sale === true) {
      const { data: p, error: readErr } = await context.supabase
        .from("products").select("price_sdg, compare_at_sdg").eq("id", productId).maybeSingle();
      if (readErr) throw readErr;
      if (!p) throw new Error("المنتج غير موجود / Product not found");
      const compare = p.compare_at_sdg != null ? Number(p.compare_at_sdg) : null;
      if (compare == null || compare <= Number(p.price_sdg)) {
        throw new Error(
          "لتفعيل العرض، أدخلي سعر المقارنة أعلى من السعر الحالي في صفحة الكتالوج. / To mark this product on sale, set a compare-at price higher than the current price in the Catalogue center.",
        );
      }
    }

    const { error } = await context.supabase.from("products").update(flags).eq("id", productId);
    if (error) throw error;
    await context.supabase.from("audit_logs").insert({
      actor_id: context.userId, action: "admin.product_flags_set",
      entity_type: "product", entity_id: productId, metadata: flags,
    });
    return { ok: true };
  });


// ---------- SITE SETTINGS (maintenance mode) ----------
export const adminUpdateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    maintenance_mode: z.boolean().optional(),
    maintenance_message_ar: z.string().trim().min(1).max(300).optional(),
    maintenance_message_en: z.string().trim().min(1).max(300).optional(),
    contact_whatsapp: z.string().trim().max(30).optional(),
    facebook_url: z.string().trim().max(300).optional(),
    instagram_url: z.string().trim().max(300).optional(),
    tiktok_url: z.string().trim().max(300).optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const patch = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) as Record<string, never>;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await context.supabase
      .from("site_settings").update(patch).eq("id", true);
    if (error) throw error;

    await context.supabase.from("audit_logs").insert({
      actor_id: context.userId, action: "admin.site_settings_updated",
      entity_type: "site_settings", entity_id: "singleton",
      metadata: { fields: Object.keys(patch) },
    });
    return { ok: true };
  });


// ---------- DELIVERY GEOGRAPHY (neighborhoods & fees) ----------
export const adminListNeighborhoods = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("neighborhoods")
      .select("*, city:cities(id, name_ar, name_en, state_id)")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  });

export const adminUpsertNeighborhood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    city_id: z.string().uuid(),
    name_ar: z.string().trim().min(1).max(120),
    name_en: z.string().trim().min(1).max(120),
    delivery_fee_sdg: z.number().nonnegative(),
    is_active: z.boolean().default(true),
    sort_order: z.number().int().min(0).default(0),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await context.supabase.from("neighborhoods").update(rest).eq("id", id);
      if (error) throw error;
      return { id };
    }
    const { data: ins, error } = await context.supabase
      .from("neighborhoods").insert(data).select("id").single();
    if (error) throw error;
    return { id: ins.id };
  });

// A neighborhood referenced by a saved customer address is never hard-deleted;
// it is disabled instead so historical orders and addresses stay intact.
export const adminDeleteNeighborhood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { count } = await context.supabase
      .from("addresses").select("*", { count: "exact", head: true })
      .eq("neighborhood_id", data.id);
    if ((count ?? 0) > 0) {
      const { error } = await context.supabase
        .from("neighborhoods").update({ is_active: false }).eq("id", data.id);
      if (error) throw error;
      return { softDisabled: true };
    }
    const { error } = await context.supabase.from("neighborhoods").delete().eq("id", data.id);
    if (error) throw error;
    return { softDisabled: false };
  });

// ---------- PRODUCT IMAGE UPLOAD ----------
// Photos go to the private `product-images` bucket and are served back to the
// storefront through /api/public/product-image/<path>. Uploads are admin-only,
// size-capped, and restricted to image MIME types.
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

export const adminUploadProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    fileName: z.string().trim().min(1).max(120),
    contentType: z.enum(ALLOWED_IMAGE_TYPES),
    // data URL body, base64-encoded
    base64: z.string().min(16).max(6_000_000),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);

    const bytes = Buffer.from(data.base64, "base64");
    if (bytes.byteLength === 0) throw new Error("ملف غير صالح / Invalid file");
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      throw new Error("حجم الصورة يتجاوز 3 ميجابايت / Image exceeds the 3 MB limit");
    }

    const ext = (data.fileName.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext || "jpg"}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("product-images")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);

    await context.supabase.from("audit_logs").insert({
      actor_id: context.userId, action: "admin.product_image_uploaded",
      entity_type: "storage", entity_id: path, metadata: { bytes: bytes.byteLength },
    });

    return { url: `/api/public/product-image/${path}` };
  });
