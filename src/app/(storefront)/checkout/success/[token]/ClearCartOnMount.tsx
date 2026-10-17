"use client";

import { useEffect } from "react";
import { cartStore } from "@/lib/cart/store";

/** Clears the cart once the order is confirmed (runs on success page mount). */
export function ClearCartOnMount() {
  useEffect(() => {
    cartStore.clear();
  }, []);
  return null;
}
