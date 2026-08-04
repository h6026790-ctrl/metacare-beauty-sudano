// Shared data hooks for the Administrator workspace.
// Wraps existing server functions only — no new business logic.
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListAllOrders, adminListProducts, adminListAuditLogs,
  adminListCustomers, adminListBrands, listTeam,
} from "@/lib/api/ops.functions";
import { adminReports } from "@/lib/api/admin.functions";
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
