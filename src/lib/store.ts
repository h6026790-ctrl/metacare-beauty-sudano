import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, CartItem, Order, OrderStatus } from "./types";
import { products } from "./mock-data";

type State = {
  user: AuthUser | null;
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];

  login: (u: { name: string; phone: string; whatsapp: string }) => void;
  logout: () => void;

  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clearCart: () => void;

  toggleWishlist: (productId: string) => void;

  placeOrder: (input: {
    name: string; phone: string; whatsapp: string;
    address: { city: string; neighborhood: string; street: string; notes?: string };
  }) => Order;

  setOrderStatus: (orderId: string, status: OrderStatus) => void;
};

const DELIVERY_FEE = 3000;

function generateOrderNumber() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `MC${y}${m}${day}-${rand}`;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      user: null,
      cart: [],
      wishlist: [],
      orders: [],

      login: (u) => set({
        user: { id: `u-${Date.now()}`, createdAt: new Date().toISOString(), ...u },
      }),
      logout: () => set({ user: null }),

      addToCart: (productId, qty = 1) => {
        const p = products.find((x) => x.id === productId);
        if (!p || p.stock <= 0) return;
        const existing = get().cart.find((i) => i.productId === productId);
        if (existing) {
          set({ cart: get().cart.map((i) => i.productId === productId ? { ...i, qty: i.qty + qty } : i) });
        } else {
          set({ cart: [...get().cart, { productId, qty }] });
        }
      },
      removeFromCart: (productId) => set({ cart: get().cart.filter((i) => i.productId !== productId) }),
      setQty: (productId, qty) => {
        if (qty <= 0) return set({ cart: get().cart.filter((i) => i.productId !== productId) });
        set({ cart: get().cart.map((i) => i.productId === productId ? { ...i, qty } : i) });
      },
      clearCart: () => set({ cart: [] }),

      toggleWishlist: (productId) => {
        const w = get().wishlist;
        set({ wishlist: w.includes(productId) ? w.filter((x) => x !== productId) : [...w, productId] });
      },

      placeOrder: (input) => {
        const items = get().cart.map((c) => {
          const p = products.find((x) => x.id === c.productId)!;
          return { productId: c.productId, qty: c.qty, price: p.price };
        });
        const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
        const delivery = DELIVERY_FEE;
        const now = new Date().toISOString();
        const order: Order = {
          id: `o-${Date.now()}`,
          number: generateOrderNumber(),
          createdAt: now,
          items, subtotal, delivery, total: subtotal + delivery,
          status: "new",
          customer: { name: input.name, phone: input.phone, whatsapp: input.whatsapp },
          address: input.address,
          history: [{ status: "new", at: now }],
        };
        set({ orders: [order, ...get().orders], cart: [] });
        return order;
      },

      setOrderStatus: (orderId, status) => {
        set({
          orders: get().orders.map((o) =>
            o.id === orderId
              ? { ...o, status, history: [...o.history, { status, at: new Date().toISOString() }] }
              : o
          ),
        });
      },
    }),
    { name: "metacare-store" }
  )
);

export const DELIVERY_FEE_SDG = DELIVERY_FEE;
