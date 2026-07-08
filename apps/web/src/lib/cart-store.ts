"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@markala/types";
import { trackAddToCart } from "./analytics";
import { track as trackVisitor } from "./visitor-analytics";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string | null;

  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setCoupon: (code: string | null) => void;
  clear: () => void;

  open: () => void;
  close: () => void;
  toggle: () => void;

  // Computed (selector helpers)
  itemCount: () => number;
  subtotal: () => number;
}

/**
 * Satırın konfigüre tiraj adedi (selections.adet, ör. "25 Adet" kademesi).
 * Additive ürünlerde kademe fiyatı totalPrice'ın İÇİNDEDİR ve `quantity` set sayısıdır
 * (sunucu da lineTotal = kademeFiyatı × quantity hesaplar) — bu yüzden adet SEPETE
 * quantity olarak taşınamaz; yalnız GÖSTERİM `quantity × itemUnitCount` yapılır.
 * Area ürünlerde selections.adet="1" (adet zaten quantity'de), pakette adet yok → 1.
 */
export function itemUnitCount(item: Pick<CartItem, "configuration">): number {
  const n = Number(item.configuration.selections?.adet);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      couponCode: null,

      addItem: (item) => {
        const id = `${item.productSlug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
        const qty = Math.min(100000, Math.max(1, item.quantity ?? 1));
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
        // Birinci-parti izleme (consent yoksa no-op; SSR güvenli)
        trackVisitor("add_to_cart", {
          type: "add_to_cart",
          productSlug: item.productSlug,
          value: item.configuration.totalPrice * qty,
        });
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },

      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.min(100000, Math.max(1, quantity)) } : i,
          ),
        }));
      },

      setCoupon: (code) => set({ couponCode: code }),

      clear: () => set({ items: [], couponCode: null }),

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),

      itemCount: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((acc, i) => acc + i.configuration.totalPrice * i.quantity, 0),
    }),
    {
      name: "markala-cart",
      // couponCode da saklanır — sepet↔ödeme arası yenileme/gezinmede kupon kaybolmasın
      // (aksi halde gösterilen indirim sessizce düşerdi).
      partialize: (s) => ({ items: s.items, couponCode: s.couponCode }),
    },
  ),
);
