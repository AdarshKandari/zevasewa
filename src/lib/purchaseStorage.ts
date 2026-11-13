
import type { Purchase } from "@/types";

const PURCHASES_KEY = "zevasewa_purchases";

export function getPurchases(): Purchase[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedPurchases = localStorage.getItem(PURCHASES_KEY);

    if (!savedPurchases) {
      return [];
    }

    const parsedPurchases: unknown = JSON.parse(savedPurchases);

    return Array.isArray(parsedPurchases)
      ? (parsedPurchases as Purchase[])
      : [];
  } catch {
    return [];
  }
}

export function savePurchases(purchases: Purchase[]): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    PURCHASES_KEY,
    JSON.stringify(purchases)
  );

  window.dispatchEvent(new Event("zevasewa-data-updated"));
}
