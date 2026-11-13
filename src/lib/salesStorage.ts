
import type { Sale } from "@/types";

const SALES_KEY = "zevasewa_sales";

export function getSales(): Sale[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedSales = localStorage.getItem(SALES_KEY);

    if (!savedSales) {
      return [];
    }

    const parsedSales: unknown = JSON.parse(savedSales);

    return Array.isArray(parsedSales)
      ? (parsedSales as Sale[])
      : [];
  } catch {
    return [];
  }
}

export function saveSales(sales: Sale[]): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(SALES_KEY, JSON.stringify(sales));

  window.dispatchEvent(new Event("zevasewa-data-updated"));
}
