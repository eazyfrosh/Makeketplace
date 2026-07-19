"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (packageId: string) => void;
  clear: () => void;
  applyCoupon: (code: string | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      addItem: (item) => {
        const exists = get().items.some((i) => i.packageId === item.packageId);
        if (exists) return;
        set({ items: [...get().items, item] });
      },
      removeItem: (packageId) =>
        set({ items: get().items.filter((i) => i.packageId !== packageId) }),
      clear: () => set({ items: [], couponCode: null }),
      applyCoupon: (code) => set({ couponCode: code }),
    }),
    { name: "nexova-cart" },
  ),
);
