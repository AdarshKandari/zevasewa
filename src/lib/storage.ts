
import type { Product } from "@/types";

const PRODUCTS_KEY = "zevasewa_products";

export function getProducts(): Product[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedProducts = localStorage.getItem(PRODUCTS_KEY);

    if (!savedProducts) {
      return [];
    }

    const parsedProducts: unknown = JSON.parse(savedProducts);

    return Array.isArray(parsedProducts)
      ? (parsedProducts as Product[])
      : [];
  } catch {
    return [];
  }
}

export function saveProducts(products: Product[]): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));

  window.dispatchEvent(new Event("zevasewa-data-updated"));
}
