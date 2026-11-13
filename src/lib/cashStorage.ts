
import type { CashTransaction } from "@/types";

const CASH_TRANSACTIONS_KEY = "zevasewa_cash_transactions";

export function getCashTransactions(): CashTransaction[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedTransactions = localStorage.getItem(
      CASH_TRANSACTIONS_KEY
    );

    if (!savedTransactions) {
      return [];
    }

    const parsedTransactions: unknown = JSON.parse(savedTransactions);

    return Array.isArray(parsedTransactions)
      ? (parsedTransactions as CashTransaction[])
      : [];
  } catch {
    return [];
  }
}

export function saveCashTransactions(
  transactions: CashTransaction[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    CASH_TRANSACTIONS_KEY,
    JSON.stringify(transactions)
  );

  window.dispatchEvent(new Event("zevasewa-data-updated"));
}
