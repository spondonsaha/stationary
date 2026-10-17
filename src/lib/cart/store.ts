"use client";

/**
 * Tiny dependency-free cart store.
 * - State lives in memory, persisted to localStorage.
 * - Components subscribe via useSyncExternalStore (no context re-render storms).
 * - Prices here are for display only; checkout re-prices everything server-side.
 */
import { useSyncExternalStore } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  stock: number;
};

const STORAGE_KEY = "inkwell-cart-v1";

let snapshot: CartItem[] = readInitial();
const listeners = new Set<() => void>();
let bump = 0; // incremented on every mutation to drive the badge animation

function readInitial(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.productId) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Private mode / quota — cart still works in-memory for this session.
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): CartItem[] {
  return snapshot;
}

function getBump(): number {
  return bump;
}

function clampQty(item: { stock: number }, qty: number): number {
  const max = Math.max(1, item.stock || 1);
  return Math.min(Math.max(1, Math.floor(qty)), max);
}

export const cartStore = {
  subscribe,
  getSnapshot,
  getBump,

  add(item: Omit<CartItem, "quantity">, quantity = 1) {
    const existing = snapshot.find((i) => i.productId === item.productId);
    if (existing) {
      snapshot = snapshot.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: clampQty(i, i.quantity + quantity) }
          : i,
      );
    } else {
      snapshot = [...snapshot, { ...item, quantity: clampQty(item, quantity) }];
    }
    bump += 1;
    emit();
  },

  setQuantity(productId: string, quantity: number) {
    snapshot = snapshot
      .map((i) =>
        i.productId === productId ? { ...i, quantity: clampQty(i, quantity) } : i,
      )
      .filter((i) => i.quantity > 0);
    bump += 1;
    emit();
  },

  remove(productId: string) {
    snapshot = snapshot.filter((i) => i.productId !== productId);
    bump += 1;
    emit();
  },

  clear() {
    snapshot = [];
    bump += 1;
    emit();
  },
};

/** Cross-tab sync. */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      snapshot = readInitial();
      listeners.forEach((l) => l());
    }
  });
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, () => snapshot);
}

export function useCartBump(): number {
  return useSyncExternalStore(cartStore.subscribe, cartStore.getBump, () => 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return Math.round(items.reduce((n, i) => n + i.unitPrice * i.quantity, 0) * 100) / 100;
}
