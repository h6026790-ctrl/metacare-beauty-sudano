// Shared data hooks for the Administrator workspace.
// Wraps existing server functions only — no new business logic.
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListAllOrders, adminListProducts, adminListAuditLogs,
  adminListCustomers, adminListBrands, listTeam,
} from "@/lib/api/ops.functions";
import { adminReports, adminListNeighborhoods } from "@/lib/api/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { listRegistrationRequests } from "@/lib/api/auth.functions";

export function useAdminOrders(enabled: boolean) {
  const fn = useServerFn(adminListAllOrders);
  return useQuery({ queryKey: ["adm-orders"], queryFn: () => fn(), enabled, refetchInterval: 60_000 });
}

export function useAdminProducts(enabled: boolean) {
  const fn = useServerFn(adminListProducts);
  return useQuery({ queryKey: ["adm-products"], queryFn: () => fn(), enabled });
}

export function useAdminAudits(enabled: boolean) {
  const fn = useServerFn(adminListAuditLogs);
  return useQuery({ queryKey: ["adm-audit"], queryFn: () => fn(), enabled });
}

export function useAdminCustomers(enabled: boolean) {
  const fn = useServerFn(adminListCustomers);
  return useQuery({ queryKey: ["adm-cust"], queryFn: () => fn(), enabled });
}

export function useAdminBrands(enabled: boolean) {
  const fn = useServerFn(adminListBrands);
  return useQuery({ queryKey: ["adm-brands"], queryFn: () => fn(), enabled });
}

export function useAdminTeam(enabled: boolean) {
  const fn = useServerFn(listTeam);
  return useQuery({ queryKey: ["adm-team"], queryFn: () => fn(), enabled });
}

export function useAdminReports(enabled: boolean) {
  const fn = useServerFn(adminReports);
  return useQuery({ queryKey: ["adm-reports"], queryFn: () => fn(), enabled });
}

export function useAdminPendingRequests(enabled: boolean) {
  const fn = useServerFn(listRegistrationRequests);
  return useQuery({
    queryKey: ["registration-requests", "pending"],
    queryFn: () => fn({ data: { status: "pending" } } as any),
    enabled,
    refetchInterval: 30_000,
  });
}

/** Stock value for a product row returned by adminListProducts. */
export function stockOf(p: any): number {
  const s = Array.isArray(p?.inventory) ? p.inventory[0]?.stock : p?.inventory?.stock;
  return Number(s ?? 0);
}

export const LOW_STOCK_THRESHOLD = 5;

export function useAdminNeighborhoods(enabled: boolean) {
  const fn = useServerFn(adminListNeighborhoods);
  return useQuery({ queryKey: ["adm-neighborhoods"], queryFn: () => fn(), enabled });
}

export function useAdminCities(enabled: boolean) {
  return useQuery({
    queryKey: ["adm-cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities").select("id, name_ar, name_en, state:states(name_ar, name_en)").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled,
  });
}

export function useAdminCategories(enabled: boolean) {
  return useQuery({
    queryKey: ["adm-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled,
  });
}
