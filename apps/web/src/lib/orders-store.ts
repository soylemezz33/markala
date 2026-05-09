"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order } from "@markala/types";

interface OrdersState {
  orders: Order[];
  add: (order: Order) => void;
  getById: (id: string) => Order | undefined;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      add: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      getById: (id) => get().orders.find((o) => o.id === id),
    }),
    { name: "markala-orders" },
  ),
);
