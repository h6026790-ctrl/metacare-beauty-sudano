import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ORDER_STATUSES = ["new","review","paid","shipping","delivered","cancelled","returned"] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

async function getRoles(ctx: any): Promise<string[]> {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  return (data ?? []).map((r: any) => r.role);
}
async function assertStaff(ctx: any) {
  const r = await getRoles(ctx);
  if (!r.includes("admin") && !r.includes("staff")) throw new Error("Forbidden");
  return r;
}
async function assertAdmin(ctx: any) {
  const r = await getRoles(ctx);
  if (!r.includes("admin")) throw new Error("Forbidden");
  return r;
}

// ---------- STAFF / CS ----------

// Customer Service agents only see orders assigned to them. Admins see all.
export const listStaffOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: OrderStatus; q?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    const roles = await assertStaff(context);
    let q = context.supabase
      .from("orders")
      .select("*, order_items(*), delivery_assignment:delivery_assignments(*)")
      .order("placed_at", { ascending: false }).limit(200);
    if (!roles.includes("admin")) q = q.eq("assigned_staff_id", context.userId);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    let result = rows ?? [];
    if (data.q) {
      const term = data.q.toLowerCase();
      result = result.filter((o: any) =>
        (o.number ?? "").toLowerCase().includes(term) ||
        (o.contact_name ?? "").toLowerCase().includes(term) ||
        (o.contact_phone ?? "").toLowerCase().includes(term),
      );
    }
    return result;
  });

// Unassigned queue (admins or any staff can pick up)
export const listUnassignedOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, number, status, total_sdg, contact_name, contact_phone, placed_at")
      .is("assigned_staff_id", null)
      .order("placed_at", { ascending: false }).limit(100);
    if (error) throw error;
    return data ?? [];
  });

export const claimOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const { error } = await context.supabase.from("orders")
      .update({ assigned_staff_id: context.userId })
      .eq("id", data.orderId);
    if (error) throw error;
    return { ok: true };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; status: string; note?: string }) =>
    z.object({
      orderId: z.string().uuid(),
      status: z.enum(ORDER_STATUSES),
      note: z.string().max(500).optional(),
    }).parse(d))
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const { error } = await context.supabase.from("orders").update({ status: data.status }).eq("id", data.orderId);
    if (error) throw error;
    if (data.note) {
      await context.supabase.from("order_notes").insert({
        order_id: data.orderId, author_id: context.userId, body: data.note,
      });
    }
    return { ok: true };
  });

export const addOrderNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; body: string }) =>
    z.object({ orderId: z.string().uuid(), body: z.string().min(1).max(1000) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const { error } = await context.supabase.from("order_notes").insert({
      order_id: data.orderId, author_id: context.userId, body: data.body,
    });
    if (error) throw error;
    return { ok: true };
  });

export const listOrderNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const { data: rows } = await context.supabase
      .from("order_notes").select("*").eq("order_id", data.orderId)
      .order("created_at", { ascending: false });
    return rows ?? [];
  });

// Customer Service marks an order as Out for Delivery. Couriers are arranged
// manually via WhatsApp — they are NOT system users. A delivery_assignments
// row is still created so the customer's order page can show the QR token
// they scan when the courier hands over the package.
export const markOutForDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; courierNote?: string }) =>
    z.object({
      orderId: z.string().uuid(),
      courierNote: z.string().max(500).optional(),
    }).parse(d))
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await context.supabase
      .from("delivery_assignments").select("id").eq("order_id", data.orderId).maybeSingle();
    if (existing) {
      await context.supabase.from("delivery_assignments").update({
        assigned_by: context.userId,
        assigned_at: new Date().toISOString(),
        qr_expires_at: expiresAt, completed_at: null,
      }).eq("id", existing.id);
    } else {
      await context.supabase.from("delivery_assignments").insert({
        order_id: data.orderId,
        assigned_by: context.userId, qr_expires_at: expiresAt,
      });
    }
    if (data.courierNote) {
      await context.supabase.from("order_notes").insert({
        order_id: data.orderId, author_id: context.userId,
        body: `Courier: ${data.courierNote}`,
      });
    }
    // Move order into shipping if currently paid
    await context.supabase.from("orders").update({ status: "shipping" })
      .eq("id", data.orderId).eq("status", "paid");
    return { ok: true };
  });

// Staff/admin directory (delivery agents no longer exist)
export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { data: rolesRows } = await context.supabase
      .from("user_roles").select("user_id, role")
      .in("role", ["staff","admin"]);
    const ids = Array.from(new Set((rolesRows ?? []).map((r: any) => r.user_id)));
    if (ids.length === 0) return { staff: [], admins: [] };
    const { data: profiles } = await context.supabase
      .from("profiles").select("id, full_name, phone, whatsapp").in("id", ids);
    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const buckets = { staff: [] as any[], admins: [] as any[] };
    for (const r of rolesRows ?? []) {
      const p = byId.get(r.user_id);
      if (!p) continue;
      if (r.role === "staff") buckets.staff.push(p);
      else if (r.role === "admin") buckets.admins.push(p);
    }
    return buckets;
  });

// ---------- ADMIN ----------

export const adminListAllOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: OrderStatus } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("placed_at", { ascending: false }).limit(500);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("products")
      .select("*, brand:brands(id, name_ar, name_en), category:categories(id, name_ar, name_en), inventory(stock)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const productInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  brand_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  description_ar: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  price_sdg: z.number().nonnegative(),
  compare_at_sdg: z.number().nonnegative().nullable().optional(),
  image_url: z.string().optional().nullable(),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export const adminUpsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => productInputSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await context.supabase.from("products").update(rest).eq("id", id);
      if (error) throw error;
      return { id };
    }
    const { data: ins, error } = await context.supabase.from("products").insert(data).select("id").single();
    if (error) throw error;
    // Init inventory row at 0 if missing
    await context.supabase.from("inventory").upsert({ product_id: ins.id, stock: 0 });
    return { id: ins.id };
  });

export const adminAdjustStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; stock: number }) =>
    z.object({ productId: z.string().uuid(), stock: z.number().int().min(0) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    await context.supabase.from("inventory").upsert({
      product_id: data.productId, stock: data.stock, updated_at: new Date().toISOString(),
    });
    return { ok: true };
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: string; grant: boolean }) =>
    z.object({
      userId: z.string().uuid(),
      role: z.enum(["admin","staff","customer"]),
      grant: z.boolean(),
    }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.grant) {
      await context.supabase.from("user_roles").insert({ user_id: data.userId, role: data.role });
    } else {
      await context.supabase.from("user_roles").delete()
        .eq("user_id", data.userId).eq("role", data.role);
    }
    await context.supabase.from("audit_logs").insert({
      actor_id: context.userId,
      action: data.grant ? "admin.role_granted" : "admin.role_revoked",
      entity_type: "user", entity_id: data.userId, metadata: { role: data.role },
    });
    return { ok: true };
  });

export const adminListAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("audit_logs").select("*").order("at", { ascending: false }).limit(100);
    return data ?? [];
  });

export const adminListCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: profiles } = await context.supabase
      .from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
    const ids = (profiles ?? []).map((p: any) => p.id);
    if (ids.length === 0) return [];
    const { data: orders } = await context.supabase
      .from("orders").select("profile_id, total_sdg").in("profile_id", ids);
    const counts = new Map<string, { count: number; total: number }>();
    for (const o of orders ?? []) {
      const k = (o as any).profile_id;
      const cur = counts.get(k) ?? { count: 0, total: 0 };
      cur.count += 1; cur.total += Number((o as any).total_sdg ?? 0);
      counts.set(k, cur);
    }
    return (profiles ?? []).map((p: any) => ({
      ...p,
      orders_count: counts.get(p.id)?.count ?? 0,
      total_spent: counts.get(p.id)?.total ?? 0,
    }));
  });

export const adminListBrands = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase.from("brands").select("*").order("sort_order");
    return data ?? [];
  });

export const adminUpsertBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    slug: z.string().min(1).max(80),
    name_ar: z.string().min(1), name_en: z.string().min(1),
    tagline_ar: z.string().optional().nullable(),
    tagline_en: z.string().optional().nullable(),
    is_active: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.id) {
      const { id, ...rest } = data;
      await context.supabase.from("brands").update(rest).eq("id", id);
      return { id };
    }
    const { data: ins } = await context.supabase.from("brands").insert(data).select("id").single();
    return { id: ins?.id };
  });

export const adminUpsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    slug: z.string().min(1).max(80),
    name_ar: z.string().min(1), name_en: z.string().min(1),
    icon: z.string().optional().nullable(),
    is_active: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.id) {
      const { id, ...rest } = data;
      await context.supabase.from("categories").update(rest).eq("id", id);
      return { id };
    }
    const { data: ins } = await context.supabase.from("categories").insert(data).select("id").single();
    return { id: ins?.id };
  });
