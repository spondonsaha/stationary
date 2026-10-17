"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cartStore, useCart, type CartItem } from "@/lib/cart/store";
import { CartDrawer } from "@/components/storefront/CartDrawer";

type CartContextValue = {
  items: CartItem[];
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useCart();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch: drawer/badges render consistently only after mount.
  useEffect(() => setMounted(true), []);

  // Close drawer on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    cartStore.add(item, quantity);
    setOpen(true);
  }, []);
  const setQuantity = useCallback(
    (id: string, q: number) => cartStore.setQuantity(id, q),
    [],
  );
  const removeItem = useCallback((id: string) => cartStore.remove(id), []);
  const clear = useCallback(() => cartStore.clear(), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const subtotal =
      Math.round(items.reduce((n, i) => n + i.unitPrice * i.quantity, 0) * 100) / 100;
    return {
      items,
      open: mounted && open,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      addItem,
      setQuantity,
      removeItem,
      clear,
      count,
      subtotal,
    };
  }, [items, open, mounted, addItem, setQuantity, removeItem, clear]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used inside <CartProvider>");
  return ctx;
}
