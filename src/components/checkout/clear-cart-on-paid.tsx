"use client";

import { useEffect } from "react";
import { useCartStore } from "@/features/cart/cart-store";

export function ClearCartOnPaid({ confirmed }: { confirmed: boolean }) {
  const clear = useCartStore((state) => state.clear);

  useEffect(() => {
    if (confirmed) clear();
  }, [clear, confirmed]);

  return null;
}
