// Shared data hooks for the Customer Service workspace.
// Reuses existing server functions only — no new business logic.
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listStaffOrders, listUnassignedOrders } from "@/lib/api/ops.functions";
import { listRegistrationRequests } from "@/lib/api/auth.functions";

export function useStaffOrders(enabled: boolean, q?: string) {
  const fn = useServerFn(listStaffOrders);
  return useQuery({
    queryKey: ["staff-orders", q ?? ""],
    queryFn: () => fn({ data: { q: q || undefined } } as any),
    enabled,
    refetchInterval: 30_000,
  });
}

export function useUnassignedOrders(enabled: boolean) {
  const fn = useServerFn(listUnassignedOrders);
  return useQuery({
    queryKey: ["staff-unassigned"],
    queryFn: () => fn(),
    enabled,
    refetchInterval: 30_000,
  });
}

export function usePendingRequests(enabled: boolean) {
  const fn = useServerFn(listRegistrationRequests);
  return useQuery({
    queryKey: ["registration-requests", "pending"],
    queryFn: () => fn({ data: { status: "pending" } } as any),
    enabled,
    refetchInterval: 20_000,
  });
}

export const isResetRequest = (r: any) => String(r?.request_type ?? "").includes("reset");

export function splitRequests(rows: any[]) {
  return {
    registrations: rows.filter((r) => !isResetRequest(r)),
    resets: rows.filter(isResetRequest),
  };
}
