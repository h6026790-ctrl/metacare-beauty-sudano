export type OrderStatus =
  | "new" | "review" | "paid" | "shipping" | "delivered" | "cancelled" | "returned";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "new", "review", "paid", "shipping", "delivered",
];

export type CategoryId = "skincare" | "makeup" | "fragrance" | "bodycare";

export type Product = {
  id: string;
  name: { ar: string; en: string };
  brandId: string;
  categoryId: CategoryId;
  price: number; // SDG
  compareAt?: number;
  image: string;
  gallery?: string[];
  description: { ar: string; en: string };
  specs: { label: { ar: string; en: string }; value: { ar: string; en: string } }[];
  stock: number; // 0 = out of stock
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
};

export type Brand = { id: string; name: { ar: string; en: string }; tagline?: { ar: string; en: string } };
export type Category = { id: CategoryId; name: { ar: string; en: string }; icon: string };

export type CartItem = { productId: string; qty: number };

export type Address = {
  city: string; // default: Wad Madani
  neighborhood: string;
  street: string;
  notes?: string;
};

export type Order = {
  id: string;
  number: string;
  createdAt: string; // ISO
  items: { productId: string; qty: number; price: number }[];
  subtotal: number;
  delivery: number;
  total: number;
  status: OrderStatus;
  customer: { name: string; phone: string; whatsapp: string };
  address: Address;
  history: { status: OrderStatus; at: string }[];
};

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  createdAt: string;
};
