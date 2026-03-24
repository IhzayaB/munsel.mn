import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  items: string[]; // product IDs
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (productId: string) => {
        const current = get().items;
        if (current.includes(productId)) {
          set({ items: current.filter((id) => id !== productId) });
        } else {
          set({ items: [...current, productId] });
        }
      },
      has: (productId: string) => get().items.includes(productId),
      clear: () => set({ items: [] }),
    }),
    { name: "pajama-wishlist" }
  )
);
