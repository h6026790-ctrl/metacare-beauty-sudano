// Legacy zustand store — kept only as a typed no-op shim so that any
// stray import doesn't break the build during the Phase 2.5 migration.
// All cart / wishlist / orders / auth now flow through React Query + Supabase.
import { create } from "zustand";

type State = {
  pendingProductId: string | null;
  setPendingProduct: (id: string | null) => void;
};

export const useUI = create<State>((set) => ({
  pendingProductId: null,
  setPendingProduct: (id) => set({ pendingProductId: id }),
}));

export const DELIVERY_FEE_SDG = 3000;
