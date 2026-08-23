"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartItem } from "@/types/catalog";

type CartState = { items: CartItem[]; addItem: (item: CartItem) => void; updateQuantity: (variantId: string, quantity: number) => void; removeItem: (variantId: string) => void; clear: () => void };
export const useCartStore = create<CartState>()(persist((set) => ({
  items: [],
  addItem: (item) => set((state) => { const existing = state.items.find((cartItem) => cartItem.variantId === item.variantId); return { items: existing ? state.items.map((cartItem) => cartItem.variantId === item.variantId ? { ...cartItem, quantity: cartItem.quantity + item.quantity } : cartItem) : [...state.items, item] }; }),
  updateQuantity: (variantId, quantity) => set((state) => ({ items: quantity < 1 ? state.items.filter((item) => item.variantId !== variantId) : state.items.map((item) => item.variantId === variantId ? { ...item, quantity } : item) })),
  removeItem: (variantId) => set((state) => ({ items: state.items.filter((item) => item.variantId !== variantId) })),
  clear: () => set({ items: [] })
}), { name: "alas_cart_v1", storage: createJSONStorage(() => localStorage), version: 1 }));
