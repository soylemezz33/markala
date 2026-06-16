"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@markala/types";
import { trackAddToCart } from "./analytics";

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;

  open: () => void;
  close: () => void;
  toggle: () => void;

  // Computed (selector helpers)
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const id = `${item.productSlug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
        const qty = item.quantity ?? 1;
        set((state) => ({
          items: [...state.items, { ...item, id, quantity: qty }],
          isOpen: true,
        }));
        // GA4 + Meta — merkezi nokta: her sepete ekleme buradan geçer
        trackAddToCart(
          { slug: item.productSlug, name: item.productName },
          qty,
          item.configuration.totalPrice * qty,
        );
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },

      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i,
          ),
        }));
      },

      clear: () => set({ items: [] }),

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),

      itemCount: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((acc, i) => acc + i.configuration.totalPrice * i.quantity, 0),
    }),
    {
      name: "markala-cart",
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
