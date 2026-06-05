import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listBrands = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("brands").select("*").eq("is_active", true).order("sort_order");
  if (error) throw error;
  return data ?? [];
});

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("categories").select("*").eq("is_active", true).order("sort_order");
  if (error) throw error;
  return data ?? [];
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { brand?: string; category?: string; featured?: boolean } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    let q = supabaseAdmin.from("products").select("*, inventory(stock)").eq("is_active", true);
    if (data.brand) {
      const { data: b } = await supabaseAdmin.from("brands").select("id").eq("slug", data.brand).maybeSingle();
      if (b) q = q.eq("brand_id", b.id);
    }
    if (data.category) {
      const { data: c } = await supabaseAdmin.from("categories").select("id").eq("slug", data.category).maybeSingle();
      if (c) q = q.eq("category_id", c.id);
    }
    if (data.featured) q = q.eq("is_featured", true);
    const { data: rows, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { data: p, error } = await supabaseAdmin
      .from("products")
      .select("*, brand:brands(*), category:categories(*), inventory(stock), images:product_images(url, sort_order)")
      .eq("slug", data.slug).maybeSingle();
    if (error) throw error;
    return p;
  });

export const listStates = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin.from("states").select("*, cities(*, neighborhoods(*))").eq("is_active", true).order("sort_order");
  return data ?? [];
});
