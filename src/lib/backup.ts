
import type { Product, Sale, Purchase, CashTransaction } from "@/types";
import { getProducts, saveProducts } from "@/lib/storage";
import { getSales, saveSales } from "@/lib/salesStorage";
import { getPurchases, savePurchases } from "@/lib/purchaseStorage";
import {
  getCashTransactions,
  saveCashTransactions,
} from "@/lib/cashStorage";

interface BackupData {
  app: "ZevaSewa";
  version: 1;
  exportedAt: string;
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  cashTransactions: CashTransaction[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValidProducts(value: unknown): value is Product[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isObject(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.category === "string" &&
        typeof item.quantity === "number" &&
        Number.isFinite(item.quantity) &&
        item.quantity >= 0 &&
        typeof item.unit === "string" &&
        typeof item.purchasePrice === "number" &&
        Number.isFinite(item.purchasePrice) &&
        item.purchasePrice >= 0 &&
        typeof item.sellingPrice === "number" &&
        Number.isFinite(item.sellingPrice) &&
        item.sellingPrice >= 0 &&
        typeof item.minStock === "number" &&
        Number.isFinite(item.minStock) &&
        item.minStock >= 0 &&
        typeof item.createdAt === "string" &&
        typeof item.updatedAt === "string"
    )
  );
}

function hasValidSales(value: unknown): value is Sale[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isObject(item) &&
        typeof item.id === "string" &&
        typeof item.totalAmount === "number" &&
        Number.isFinite(item.totalAmount) &&
        item.totalAmount >= 0 &&
        typeof item.createdAt === "string" &&
        Array.isArray(item.items) &&
        item.items.every(
          (saleItem: unknown) =>
            isObject(saleItem) &&
            typeof saleItem.productId === "string" &&
            typeof saleItem.productName === "string" &&
            typeof saleItem.quantity === "number" &&
            Number.isFinite(saleItem.quantity) &&
            saleItem.quantity > 0 &&
            typeof saleItem.unit === "string" &&
            typeof saleItem.sellingPrice === "number" &&
            Number.isFinite(saleItem.sellingPrice) &&
            saleItem.sellingPrice >= 0 &&
            typeof saleItem.total === "number" &&
            Number.isFinite(saleItem.total) &&
            saleItem.total >= 0
        )
    )
  );
}

function hasValidPurchases(value: unknown): value is Purchase[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isObject(item) &&
        typeof item.id === "string" &&
        typeof item.totalAmount === "number" &&
        Number.isFinite(item.totalAmount) &&
        item.totalAmount >= 0 &&
        typeof item.createdAt === "string" &&
        Array.isArray(item.items) &&
        item.items.every(
          (purchaseItem: unknown) =>
            isObject(purchaseItem) &&
            typeof purchaseItem.productId === "string" &&
            typeof purchaseItem.productName === "string" &&
            typeof purchaseItem.quantity === "number" &&
            Number.isFinite(purchaseItem.quantity) &&
            purchaseItem.quantity > 0 &&
            typeof purchaseItem.unit === "string" &&
            typeof purchaseItem.purchasePrice === "number" &&
            Number.isFinite(purchaseItem.purchasePrice) &&
            purchaseItem.purchasePrice >= 0 &&
            typeof purchaseItem.total === "number" &&
            Number.isFinite(purchaseItem.total) &&
            purchaseItem.total >= 0
        )
    )
  );
}

function hasValidCashTransactions(
  value: unknown
): value is CashTransaction[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isObject(item) &&
        typeof item.id === "string" &&
        (item.type === "income" || item.type === "expense") &&
        typeof item.description === "string" &&
        typeof item.category === "string" &&
        typeof item.amount === "number" &&
        Number.isFinite(item.amount) &&
        item.amount > 0 &&
        typeof item.createdAt === "string"
    )
  );
}

export function createBackup(): BackupData {
  return {
    app: "ZevaSewa",
    version: 1,
    exportedAt: new Date().toISOString(),
    products: getProducts(),
    sales: getSales(),
    purchases: getPurchases(),
    cashTransactions: getCashTransactions(),
  };
}

export function validateBackup(
  value: unknown
): value is BackupData {
  return (
    isObject(value) &&
    value.app === "ZevaSewa" &&
    value.version === 1 &&
    typeof value.exportedAt === "string" &&
    hasValidProducts(value.products) &&
    hasValidSales(value.sales) &&
    hasValidPurchases(value.purchases) &&
    hasValidCashTransactions(value.cashTransactions)
  );
}

export function restoreBackup(data: BackupData): void {
  saveProducts(data.products);
  saveSales(data.sales);
  savePurchases(data.purchases);
  saveCashTransactions(data.cashTransactions);
}
