import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SHIPPING_COST } from "@/lib/utils";

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  nameMn: string;
  price: number;
  size?: string;
  color?: string;
  quantity: number;
  image?: string;
  maxStock?: number;
}

interface CartState {
  items: CartItem[];
  shippingCost: number;
  _settingsFetched: boolean;
  fetchShippingSettings: () => Promise<void>;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getShippingCost: () => number;
  getGrandTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shippingCost: SHIPPING_COST,
      _settingsFetched: false,

      fetchShippingSettings: async () => {
        if (get()._settingsFetched) return;
        try {
          const res = await fetch("/api/settings/public");
          if (res.ok) {
            const data = await res.json();
            set({
              shippingCost: Number(data.shippingCost) || SHIPPING_COST,
              _settingsFetched: true,
            });
          }
        } catch {
          // keep defaults
        }
      },

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.productId === item.productId && i.variantId === item.variantId
          );

          if (existing) {
            const maxStock = item.maxStock || 99;
            const newQty = Math.min(existing.quantity + item.quantity, maxStock);
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.variantId === item.variantId
                  ? { ...i, quantity: newQty }
                  : i
              ),
            };
          }

          return { items: [...state.items, item] };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        })),

      updateQuantity: (productId, quantity, variantId) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) =>
                    !(i.productId === productId && i.variantId === variantId)
                )
              : state.items.map((i) => {
                  if (i.productId === productId && i.variantId === variantId) {
                    const max = i.maxStock || 99;
                    return { ...i, quantity: Math.min(quantity, max) };
                  }
                  return i;
                }),
        })),

      clearCart: () => set({ items: [] }),

      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),

      getShippingCost: () => get().shippingCost,

      getGrandTotal: () => get().getTotalPrice() + get().getShippingCost(),
    }),
    {
      name: "munsel-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
