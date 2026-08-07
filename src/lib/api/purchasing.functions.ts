// Purchase invoices and inventory movement history.
// Stock only rises when an invoice is approved — a draft invoice never
// touches inventory. Existing reservation / restore logic is untouched;
// movements are recorded by a database trigger on every stock change.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: any) {
  const { data } = await ctx.supabase
    .from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("admin")) throw new Error("Forbidden");
}

const sb = (ctx: any) => ctx.supabase as any;

export const adminListPurchaseInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await sb(context)
      .from("purchase_invoices")
      .select("*, items:purchase_invoice_items(id, qty, purchase_price_sdg)")
      .order("invoice_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const adminGetPurchaseInvoice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { invoiceId: string }) =>
    z.object({ invoiceId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: inv, error } = await sb(context)
      .from("purchase_invoices")
      .select("*, items:purchase_invoice_items(id, product_id, qty, purchase_price_sdg, selling_price_sdg, product:products(id, name_ar, name_en, price_sdg, image_url))")
      .eq("id", data.invoiceId).maybeSingle();
    if (error) throw error;
    if (!inv) throw new Error("invoice_not_found");
    return inv;
  });

export const adminSavePurchaseInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    invoice_number: z.string().trim().min(1).max(60),
    invoice_date: z.string().min(4).max(20),
    supplier_name: z.string().trim().min(1).max(160),
    notes: z.string().max(1000).nullable().optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.id) {
      const { data: cur } = await sb(context)
        .from("purchase_invoices").select("status").eq("id", data.id).maybeSingle();
      if (cur?.status === "approved") throw new Error("invoice_already_approved");
      const { id, ...rest } = data;
      const { error } = await sb(context).from("purchase_invoices").update(rest).eq("id", id);
      if (error) throw error;
      return { id };
    }
    const { data: ins, error } = await sb(context)
      .from("purchase_invoices")
      .insert({ ...data, created_by: context.userId, status: "draft" })
      .select("id").single();
    if (error) throw error;
    return { id: ins?.id as string };
  });

async function assertDraft(ctx: any, invoiceId: string) {
  const { data } = await sb(ctx)
    .from("purchase_invoices").select("status").eq("id", invoiceId).maybeSingle();
  if (!data) throw new Error("invoice_not_found");
  if (data.status === "approved") throw new Error("invoice_already_approved");
}

async function recalcTotal(ctx: any, invoiceId: string) {
  const { data } = await sb(ctx)
    .from("purchase_invoice_items").select("qty, purchase_price_sdg").eq("invoice_id", invoiceId);
  const total = ((data ?? []) as any[])
    .reduce((s, i) => s + Number(i.qty ?? 0) * Number(i.purchase_price_sdg ?? 0), 0);
  await sb(ctx).from("purchase_invoices").update({ total_sdg: total }).eq("id", invoiceId);
  return total;
}

export const adminSaveInvoiceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    invoice_id: z.string().uuid(),
    product_id: z.string().uuid(),
    qty: z.number().int().min(1).max(100000),
    purchase_price_sdg: z.number().nonnegative(),
    selling_price_sdg: z.number().nonnegative().nullable().optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    await assertDraft(context, data.invoice_id);
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await sb(context).from("purchase_invoice_items").update(rest).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await sb(context).from("purchase_invoice_items").insert(data);
      if (error) throw error;
    }
    const total = await recalcTotal(context, data.invoice_id);
    return { ok: true, total };
  });

export const adminDeleteInvoiceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { itemId: string; invoiceId: string }) =>
    z.object({ itemId: z.string().uuid(), invoiceId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    await assertDraft(context, data.invoiceId);
    const { error } = await sb(context).from("purchase_invoice_items").delete().eq("id", data.itemId);
    if (error) throw error;
    const total = await recalcTotal(context, data.invoiceId);
    return { ok: true, total };
  });

export const adminDeletePurchaseInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { invoiceId: string }) =>
    z.object({ invoiceId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    await assertDraft(context, data.invoiceId);
    const { error } = await sb(context).from("purchase_invoices").delete().eq("id", data.invoiceId);
    if (error) throw error;
    return { ok: true };
  });

/** Approval is the only path that raises stock from a purchase invoice. */
export const adminApprovePurchaseInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { invoiceId: string }) =>
    z.object({ invoiceId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: res, error } = await sb(context)
      .rpc("approve_purchase_invoice", { _invoice_id: data.invoiceId });
    if (error) throw new Error(error.message);
    return res as { ok: boolean; total: number };
  });

/** Movement history — every stock change with its source and reference. */
export const adminListInventoryMovements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    productId: z.string().uuid().nullable().optional(),
    source: z.string().max(40).nullable().optional(),
    limit: z.number().int().min(1).max(500).optional(),
  }).parse(d ?? {}))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    let q = sb(context)
      .from("inventory_movements")
      .select("*, product:products(id, name_ar, name_en, image_url)")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.productId) q = q.eq("product_id", data.productId);
    if (data.source) q = q.eq("source", data.source);
    const { data: rows, error } = await q;
    if (error) throw error;

    // Attach the purchase invoice number for movements that came from one.
    const invoiceIds = Array.from(new Set(((rows ?? []) as any[])
      .filter((r) => r.reference_type === "purchase_invoice" && r.reference_id)
      .map((r) => r.reference_id)));
    let invoices: Record<string, any> = {};
    if (invoiceIds.length) {
      const { data: invs } = await sb(context)
        .from("purchase_invoices").select("id, invoice_number, supplier_name").in("id", invoiceIds);
      for (const i of (invs ?? []) as any[]) invoices[i.id] = i;
    }
    return ((rows ?? []) as any[]).map((r) => ({
      ...r,
      invoice: r.reference_type === "purchase_invoice" ? invoices[r.reference_id] ?? null : null,
    }));
  });
