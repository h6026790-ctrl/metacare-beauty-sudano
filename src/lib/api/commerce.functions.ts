import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- CART ----------
async function ensureCart(supabase: any, userId: string): Promise<string> {
  const { data: existing } = await supabase.from("carts").select("id").eq("profile_id", userId).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase.from("carts").insert({ profile_id: userId }).select("id").single();
  if (error) throw error;
  return data.id;
}

export const getMyCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const cartId = await ensureCart(supabase, userId);
    const { data: items } = await supabase
      .from("cart_items")
      .select("qty, product:products(id, slug, name_ar, name_en, price_sdg, image_url, is_active, inventory(stock))")
      .eq("cart_id", cartId);
    return { cartId, items: items ?? [] };
  });

export const addToCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; qty?: number }) => z.object({ productId: z.string().uuid(), qty: z.number().int().positive().default(1) }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const cartId = await ensureCart(supabase, userId);
    const { data: existing } = await supabase.from("cart_items").select("qty").eq("cart_id", cartId).eq("product_id", data.productId).maybeSingle();
    if (existing) {
      await supabase.from("cart_items").update({ qty: existing.qty + data.qty }).eq("cart_id", cartId).eq("product_id", data.productId);
    } else {
      await supabase.from("cart_items").insert({ cart_id: cartId, product_id: data.productId, qty: data.qty });
    }
    return { ok: true };
  });

export const setCartQty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; qty: number }) => z.object({ productId: z.string().uuid(), qty: z.number().int().min(0) }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const cartId = await ensureCart(supabase, userId);
    if (data.qty === 0) {
      await supabase.from("cart_items").delete().eq("cart_id", cartId).eq("product_id", data.productId);
    } else {
      await supabase.from("cart_items").update({ qty: data.qty }).eq("cart_id", cartId).eq("product_id", data.productId);
    }
    return { ok: true };
  });

export const clearCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const cartId = await ensureCart(context.supabase, context.userId);
    await context.supabase.from("cart_items").delete().eq("cart_id", cartId);
    return { ok: true };
  });

// ---------- WISHLIST ----------
export const getMyWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("wishlists")
      .select("product:products(id, slug, name_ar, name_en, price_sdg, image_url, inventory(stock))")
      .eq("profile_id", context.userId);
    return data ?? [];
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string }) => z.object({ productId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase.from("wishlists").select("product_id").eq("profile_id", userId).eq("product_id", data.productId).maybeSingle();
    if (existing) await supabase.from("wishlists").delete().eq("profile_id", userId).eq("product_id", data.productId);
    else await supabase.from("wishlists").insert({ profile_id: userId, product_id: data.productId });
    return { ok: true, added: !existing };
  });

// ---------- CHECKOUT ----------
const DEFAULT_DELIVERY_SDG = 3000;

const checkoutSchema = z.object({
  contact_name: z.string().min(1).max(120),
  contact_phone: z.string().min(6).max(30),
  contact_whatsapp: z.string().min(6).max(30),
  address_state: z.string().min(1),
  address_city: z.string().min(1),
  address_neighborhood: z.string().optional(),
  address_street: z.string().min(1),
  address_notes: z.string().max(500).optional(),
  // Server resolves the fee from this id; any client-sent amount is ignored.
  neighborhood_id: z.string().uuid().optional().nullable(),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => checkoutSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // Only customer accounts may place orders — staff/admin are rejected server-side.
    const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (roleRows ?? []).map((r: any) => r.role);
    if (!roles.includes("customer")) throw new Error("Only customer accounts can place orders");
    const cartId = await ensureCart(supabase, userId);
    const { data: items } = await supabase
      .from("cart_items")
      .select("qty, product:products(id, name_ar, name_en, price_sdg, is_active)")
      .eq("cart_id", cartId);
    if (!items || items.length === 0) throw new Error("Cart is empty");

    // Authoritative delivery fee: read from the neighbourhood row server-side.
    let deliveryFee = DEFAULT_DELIVERY_SDG;
    if (data.neighborhood_id) {
      const { data: hood } = await supabase
        .from("neighborhoods")
        .select("delivery_fee_sdg, is_active")
        .eq("id", data.neighborhood_id)
        .maybeSingle();
      if (hood?.is_active) deliveryFee = Number(hood.delivery_fee_sdg);
    }

    let subtotal = 0;
    const orderItems = items.map((i: any) => {
      const price = Number(i.product.price_sdg);
      subtotal += price * i.qty;
      return { product_id: i.product.id, name_snapshot: i.product.name_en, qty: i.qty, price_sdg: price };
    });
    const total = subtotal + deliveryFee;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        profile_id: userId,
        subtotal_sdg: subtotal,
        delivery_sdg: deliveryFee,
        total_sdg: total,
        contact_name: data.contact_name,
        contact_phone: data.contact_phone,
        contact_whatsapp: data.contact_whatsapp,
        address_state: data.address_state,
        address_city: data.address_city,
        address_neighborhood: data.address_neighborhood,
        address_street: data.address_street,
        address_notes: data.address_notes,
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));
    if (itemsErr) throw itemsErr;

    await supabase.from("cart_items").delete().eq("cart_id", cartId);
    return { order };
  });

// ---------- ORDERS (customer view) ----------
export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("profile_id", context.userId)
      .order("placed_at", { ascending: false });
    return data ?? [];
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: order } = await context.supabase
      .from("orders")
      .select("*, order_items(*), order_status_history(*)")
      .eq("id", data.id)
      .eq("profile_id", context.userId)
      .maybeSingle();
    return order;
  });
