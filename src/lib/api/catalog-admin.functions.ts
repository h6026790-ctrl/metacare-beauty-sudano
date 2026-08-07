// Category administration for the Administrator workspace.
// Categories are soft-archived only (is_active) so product relationships
// are never broken. No authentication, role, or RLS behaviour is changed —
// every function re-checks the admin role exactly like the existing ones.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: any) {
  const { data } = await ctx.supabase
    .from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("admin")) throw new Error("Forbidden");
}

/** Categories with the number of products attached to each one. */
export const adminListCategoriesFull = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: cats, error } = await context.supabase
      .from("categories").select("*").order("sort_order", { ascending: true });
    if (error) throw error;
    const { data: prods } = await context.supabase
      .from("products").select("id, category_id, is_active");

    const counts = new Map<string, { total: number; active: number }>();
    for (const p of (prods ?? []) as any[]) {
      if (!p.category_id) continue;
      const c = counts.get(p.category_id) ?? { total: 0, active: 0 };
      c.total += 1;
      if (p.is_active) c.active += 1;
      counts.set(p.category_id, c);
    }
    const uncategorised = ((prods ?? []) as any[]).filter((p) => !p.category_id).length;

    return {
      categories: ((cats ?? []) as any[]).map((c) => ({
        ...c,
        product_count: counts.get(c.id)?.total ?? 0,
        active_product_count: counts.get(c.id)?.active ?? 0,
      })),
      uncategorised,
    };
  });

/** Create or update a category, including its image and display order. */
export const adminSaveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    slug: z.string().trim().min(1).max(80),
    name_ar: z.string().trim().min(1),
    name_en: z.string().trim().min(1),
    description_ar: z.string().max(500).nullable().optional(),
    description_en: z.string().max(500).nullable().optional(),
    icon: z.string().max(60).nullable().optional(),
    image_url: z.string().max(1000).nullable().optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
    is_active: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.id) {
      const { id, slug: _slug, ...rest } = data;
      // Slug stays stable once created so existing links keep working.
      const { error } = await context.supabase
        .from("categories").update(rest as never).eq("id", id);
      if (error) throw error;
      return { id };
    }
    const { data: ins, error } = await context.supabase
      .from("categories").insert(data as never).select("id").single();
    if (error) throw error;
    return { id: (ins as any)?.id };
  });

/** Archive (soft delete) or restore a category. Products keep their link. */
export const adminSetCategoryActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { categoryId: string; active: boolean }) =>
    z.object({ categoryId: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("categories").update({ is_active: data.active } as never).eq("id", data.categoryId);
    if (error) throw error;
    return { ok: true };
  });

/** Persist a new display order for the whole category list. */
export const adminReorderCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { order: { id: string; sort_order: number }[] }) =>
    z.object({
      order: z.array(z.object({
        id: z.string().uuid(),
        sort_order: z.number().int().min(0).max(9999),
      })).min(1).max(200),
    }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    for (const row of data.order) {
      const { error } = await context.supabase
        .from("categories").update({ sort_order: row.sort_order } as never).eq("id", row.id);
      if (error) throw error;
    }
    return { ok: true };
  });

/** Move products between categories (or clear the category with null). */
export const adminMoveProductsToCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productIds: string[]; categoryId: string | null }) =>
    z.object({
      productIds: z.array(z.string().uuid()).min(1).max(500),
      categoryId: z.string().uuid().nullable(),
    }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("products").update({ category_id: data.categoryId } as never)
      .in("id", data.productIds);
    if (error) throw error;
    return { ok: true, moved: data.productIds.length };
  });
