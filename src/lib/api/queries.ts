// Client-side React Query hooks. Catalog reads go through the hardened
// catalogue feeds: `catalog_public` (visitors — no prices, no quantities) and
// `catalog_authenticated` (signed-in users — prices included). Prices and
// inventory numbers are enforced at the database layer, not in the UI.
// Cart/wishlist/orders go through server functions defined in
// `commerce.functions.ts` and `ops.functions.ts`.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  addToCart, setCartQty, clearCart, getMyCart,
  getMyWishlist, toggleWishlist,
  placeOrder, listMyOrders, getMyOrder,
} from "./commerce.functions";
import { getMyProfile, updateMyProfile, upsertDefaultAddress, changeMyPassword } from "./account.functions";
import type { Lang } from "@/i18n/dict";
import { useAuth } from "@/hooks/useAuth";

// ---------- CATALOG ----------
export type UIProduct = {
  id: string;
  slug: string;
  name: { ar: string; en: string };
  brandId: string | null;
  brand?: { id: string; slug: string; name: { ar: string; en: string } } | null;
  categoryId: string | null;
  price: number;
  compareAt?: number | null;
  image: string;
  description: { ar: string; en: string };
  inStock: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
};

/** Catalogue feed name for the current viewer. */
function feedFor(signedIn: boolean) {
  return signedIn ? "catalog_authenticated" : "catalog_public";
}

function rowToProduct(r: any): UIProduct {
  // Rows may come from the catalogue feeds (flattened brand columns, boolean
  // `in_stock`) or from a joined product row (server functions / admin).
  const stock = Array.isArray(r.inventory) ? (r.inventory[0]?.stock ?? 0) : (r.inventory?.stock ?? 0);
  const inStock = typeof r.in_stock === "boolean" ? r.in_stock : stock > 0;
  const brand = r.brand
    ? { id: r.brand.id, slug: r.brand.slug, name: { ar: r.brand.name_ar, en: r.brand.name_en } }
    : r.brand_id && r.brand_slug
      ? { id: r.brand_id, slug: r.brand_slug, name: { ar: r.brand_name_ar, en: r.brand_name_en } }
      : null;
  return {
    id: r.id, slug: r.slug,
    name: { ar: r.name_ar, en: r.name_en },
    brandId: r.brand_id, brand,
    categoryId: r.category_id,
    // Visitors never receive `price_sdg` from the API; the UI gates pricing anyway.
    price: r.price_sdg != null ? Number(r.price_sdg) : 0,
    compareAt: r.compare_at_sdg != null ? Number(r.compare_at_sdg) : null,
    image: r.image_url || "/placeholder.svg",
    description: { ar: r.description_ar ?? "", en: r.description_en ?? "" },
    inStock,
    isNew: !!r.is_new, isBestSeller: !!r.is_best_seller, isFeatured: !!r.is_featured,
  };
}

export type UIBrand = { id: string; slug: string; name: { ar: string; en: string }; tagline?: { ar: string; en: string } | null; logoUrl?: string | null };
export type UICategory = { id: string; slug: string; name: { ar: string; en: string }; icon?: string | null };

export function useProducts(filter?: { brand?: string; category?: string; featured?: boolean; isNew?: boolean; isBest?: boolean; onSale?: boolean }) {
  const { user } = useAuth();
  const signedIn = !!user;
  return useQuery({
    queryKey: ["products", signedIn, filter ?? {}],
    queryFn: async (): Promise<UIProduct[]> => {
      let q = (supabase as any).from(feedFor(signedIn)).select("*");
      if (filter?.featured) q = q.eq("is_featured", true);
      if (filter?.isNew) q = q.eq("is_new", true);
      if (filter?.isBest) q = q.eq("is_best_seller", true);
      if (filter?.onSale) q = q.eq("has_discount", true);
      if (filter?.brand) q = q.eq("brand_slug", filter.brand);
      if (filter?.category) q = q.eq("category_slug", filter.category);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToProduct);
    },
  });
}

export function useProduct(slug: string) {
  const { user } = useAuth();
  const signedIn = !!user;
  return useQuery({
    queryKey: ["product", signedIn, slug],
    queryFn: async (): Promise<UIProduct | null> => {
      const { data, error } = await (supabase as any)
        .from(feedFor(signedIn))
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToProduct(data) : null;
    },
    enabled: !!slug,
  });
}

export function useSearchProducts(term: string) {
  const { user } = useAuth();
  const signedIn = !!user;
  return useQuery({
    queryKey: ["search", signedIn, term],
    queryFn: async (): Promise<UIProduct[]> => {
      if (!term.trim()) return [];
      const like = `%${term}%`;
      const { data, error } = await (supabase as any)
        .from(feedFor(signedIn))
        .select("*")
        .or(`name_ar.ilike.${like},name_en.ilike.${like},slug.ilike.${like}`)
        .limit(60);
      if (error) throw error;
      return (data ?? []).map(rowToProduct);
    },
    enabled: term.trim().length > 0,
  });
}


export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async (): Promise<UIBrand[]> => {
      const { data, error } = await supabase.from("brands").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return (data ?? []).map((b) => ({
        id: b.id, slug: b.slug,
        name: { ar: b.name_ar, en: b.name_en },
        tagline: b.tagline_ar ? { ar: b.tagline_ar, en: b.tagline_en ?? "" } : null,
        logoUrl: b.logo_url,
      }));
    },
  });
}
export function useBrand(slug: string) {
  return useQuery({
    queryKey: ["brand", slug],
    queryFn: async (): Promise<UIBrand | null> => {
      const { data } = await supabase.from("brands").select("*").eq("slug", slug).maybeSingle();
      if (!data) return null;
      return { id: data.id, slug: data.slug, name: { ar: data.name_ar, en: data.name_en },
        tagline: data.tagline_ar ? { ar: data.tagline_ar, en: data.tagline_en ?? "" } : null, logoUrl: data.logo_url };
    },
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<UICategory[]> => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return (data ?? []).map((c) => ({ id: c.id, slug: c.slug, name: { ar: c.name_ar, en: c.name_en }, icon: c.icon }));
    },
  });
}

// Geography for checkout
export function useStatesTree() {
  return useQuery({
    queryKey: ["states-tree"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("states")
        .select("*, cities:cities(*, neighborhoods:neighborhoods(*))")
        .eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ---------- CART ----------
export function useCart() {
  const fn = useServerFn(getMyCart);
  const { user } = useAuth();
  return useQuery({ queryKey: ["cart"], queryFn: () => fn(), staleTime: 5_000, enabled: !!user });
}
export function useAddToCart() {
  const fn = useServerFn(addToCart);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => fn({ data: { productId, qty: 1 } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}
export function useSetCartQty() {
  const fn = useServerFn(setCartQty);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { productId: string; qty: number }) => fn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}
export function useClearCart() {
  const fn = useServerFn(clearCart);
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => fn(), onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }) });
}

// ---------- WISHLIST ----------
export function useWishlist() {
  const fn = useServerFn(getMyWishlist);
  const { user } = useAuth();
  return useQuery({ queryKey: ["wishlist"], queryFn: () => fn(), staleTime: 10_000, enabled: !!user });
}
export function useToggleWishlist() {
  const fn = useServerFn(toggleWishlist);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => fn({ data: { productId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });
}

// ---------- ORDERS (customer) ----------
export function useMyOrders() {
  const fn = useServerFn(listMyOrders);
  const { user } = useAuth();
  return useQuery({ queryKey: ["my-orders"], queryFn: () => fn(), enabled: !!user });
}
export function useMyOrder(id: string) {
  const fn = useServerFn(getMyOrder);
  const { user } = useAuth();
  return useQuery({ queryKey: ["my-order", id], queryFn: () => fn({ data: { id } }), enabled: !!id && !!user });
}
export function usePlaceOrder() {
  const fn = useServerFn(placeOrder);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => (fn as any)({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
  });
}

// ---------- PROFILE ----------
export function useMyProfile() {
  const fn = useServerFn(getMyProfile);
  const { user } = useAuth();
  return useQuery({ queryKey: ["my-profile"], queryFn: () => fn(), enabled: !!user });
}
export function useUpdateProfile() {
  const fn = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { full_name: string; phone: string; whatsapp: string }) => fn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-profile"] }),
  });
}
export function useChangePassword() {
  const fn = useServerFn(changeMyPassword);
  return useMutation({
    mutationFn: (vars: { current_password: string; new_password: string }) => fn({ data: vars }),
  });
}
export function useUpsertAddress() {
  const fn = useServerFn(upsertDefaultAddress);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: any) => (fn as any)({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-profile"] }),
  });
}

// Helpers
export function pickName(o: { name: { ar: string; en: string } }, lang: Lang) {
  return o.name[lang];
}
