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
