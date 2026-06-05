import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(ctx: any) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("admin") && !roles.includes("staff")) throw new Error("Forbidden");
}
async function assertAgent(ctx: any) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("agent") && !roles.includes("admin")) throw new Error("Forbidden");
}

// ---------- STAFF / CS ----------
const ORDER_STATUSES = ["new","review","paid","shipping","delivered","cancelled","returned"] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

export const listAllOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: OrderStatus } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    let q = context.supabase
      .from("orders")
      .select("*, order_items(*), delivery_assignment:delivery_assignments(*)")
      .order("placed_at", { ascending: false }).limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; status: string; note?: string }) =>
    z.object({
      orderId: z.string().uuid(),
      status: z.enum(["new","review","paid","shipping","delivered","cancelled","returned"]),
      note: z.string().max(500).optional(),
    }).parse(d))
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    const { error } = await context.supabase.from("orders").update({ status: data.status }).eq("id", data.orderId);
    if (error) throw error;
    if (data.note) {
      await context.supabase.from("order_status_history").insert({ order_id: data.orderId, status: data.status, actor_id: context.userId, note: data.note });
    }
    return { ok: true };
  });

export const assignDeliveryAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; agentId: string }) => z.object({ orderId: z.string().uuid(), agentId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertStaff(context);
    // Upsert assignment (one per order)
    const { data: existing } = await context.supabase.from("delivery_assignments").select("id").eq("order_id", data.orderId).maybeSingle();
    if (existing) {
      await context.supabase.from("delivery_assignments").update({ agent_id: data.agentId, assigned_by: context.userId, assigned_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await context.supabase.from("delivery_assignments").insert({ order_id: data.orderId, agent_id: data.agentId, assigned_by: context.userId });
    }
    // Move order into shipping if currently paid
    await context.supabase.from("orders").update({ status: "shipping" }).eq("id", data.orderId).eq("status", "paid");
    return { ok: true };
  });

export const listStaffAndAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { data } = await context.supabase
      .from("user_roles").select("user_id, role, profiles:profiles!inner(full_name, phone)")
      .in("role", ["staff","agent","admin"]);
    return data ?? [];
  });

// ---------- DELIVERY AGENT ----------
export const listMyDeliveries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAgent(context);
    const { data } = await context.supabase
      .from("delivery_assignments")
      .select("*, order:orders(*, order_items(*))")
      .eq("agent_id", context.userId)
      .order("assigned_at", { ascending: false });
    return data ?? [];
  });

export const completeDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { qrToken: string }) => z.object({ qrToken: z.string().min(4) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAgent(context);
    const { data: assign } = await context.supabase
      .from("delivery_assignments").select("id, order_id, agent_id").eq("qr_token", data.qrToken).maybeSingle();
    if (!assign) throw new Error("Invalid QR token");
    if (assign.agent_id !== context.userId) throw new Error("Not your assignment");
    await context.supabase.from("delivery_assignments").update({ completed_at: new Date().toISOString() }).eq("id", assign.id);
    await context.supabase.from("orders").update({ status: "delivered" }).eq("id", assign.order_id);
    return { ok: true, orderId: assign.order_id };
  });

// ---------- ADMIN ----------
export const adminAdjustStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; stock: number }) => z.object({ productId: z.string().uuid(), stock: z.number().int().min(0) }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r: any) => r.role === "admin")) throw new Error("Forbidden");
    await context.supabase.from("inventory").upsert({ product_id: data.productId, stock: data.stock, updated_at: new Date().toISOString() });
    return { ok: true };
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: string }) =>
    z.object({ userId: z.string().uuid(), role: z.enum(["admin","staff","agent","customer"]) }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r: any) => r.role === "admin")) throw new Error("Forbidden");
    await context.supabase.from("user_roles").insert({ user_id: data.userId, role: data.role });
    await context.supabase.from("audit_logs").insert({ actor_id: context.userId, action: "admin.role_granted", entity_type: "user", entity_id: data.userId, metadata: { role: data.role } });
    return { ok: true };
  });
