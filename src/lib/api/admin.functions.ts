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
