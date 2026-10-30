"use client";

import type { Product } from "./catalog";

export type CartItem = {
  product: Product;
  qty: number;
  note?: string;
};

const STORAGE_KEY = "boxgoods-cart";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart-change", { detail: items }));
}

export function getCart(): CartItem[] {
  return readCart();
}

export function addToCart(product: Product, qty = 1, note?: string) {
  const cart = readCart();
  const idx = cart.findIndex((i) => i.product.id === product.id);
  if (idx >= 0) {
    cart[idx].qty += qty;
    if (note) cart[idx].note = note;
  } else {
    cart.push({ product, qty, note });
  }
  writeCart(cart);
}

export function removeFromCart(productId: string) {
  const cart = readCart().filter((i) => i.product.id !== productId);
  writeCart(cart);
}

export function updateQty(productId: string, qty: number) {
  const cart = readCart();
  const idx = cart.findIndex((i) => i.product.id === productId);
  if (idx >= 0) {
    if (qty <= 0) cart.splice(idx, 1);
    else cart[idx].qty = qty;
    writeCart(cart);
  }
}

export function updateNote(productId: string, note: string) {
  const cart = readCart();
  const idx = cart.findIndex((i) => i.product.id === productId);
  if (idx >= 0) {
    cart[idx].note = note;
    writeCart(cart);
  }
}

export function clearCart() {
  writeCart([]);
}

export function getCartCount(): number {
  return readCart().reduce((sum, i) => sum + i.qty, 0);
}

export function getCartSubtotal(): number {
  return readCart().reduce((sum, i) => sum + (i.product.priceMin || 0) * i.qty, 0);
}

export function onCartChange(cb: (items: CartItem[]) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (e: CustomEvent<CartItem[]>) => cb(e.detail);
  window.addEventListener("cart-change", handler as EventListener);
  return () => window.removeEventListener("cart-change", handler as EventListener);
}