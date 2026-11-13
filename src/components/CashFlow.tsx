
"use client";

import { useEffect, useState } from "react";
import type { CashTransaction } from "@/types";
import {
  getCashTransactions,
  saveCashTransactions,
} from "@/lib/cashStorage";

export default function CashFlow() {
  const [transactions, setTransactions] = useState<CashTransaction[]>(
    () => getCashTransactions()
  );

  const [type, setType] = useState<"income" | "expense">("income");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  // Refresh transactions when Firestore updates LocalStorage.
  useEffect(() => {
    function refreshTransactions() {
      setTransactions(getCashTransactions());
    }

    window.addEventListener(
      "zevasewa-data-updated",
      refreshTransactions
    );

    return () => {
      window.removeEventListener(
        "zevasewa-data-updated",
        refreshTransactions
      );
    };
  }, []);

  const totalIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  const totalExpenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  const balance = totalIncome - totalExpenses;

  function recordTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const numericAmount = Number(amount);

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    const newTransaction: CashTransaction = {
      id: crypto.randomUUID(),
      type,
      description: description.trim(),
      amount: numericAmount,
      category,
      createdAt: new Date().toISOString(),
    };

    const updatedTransactions = [
      newTransaction,
      ...transactions,
    ];

    saveCashTransactions(updatedTransactions);
    setTransactions(updatedTransactions);
    setDescription("");
    setAmount("");
    setCategory("General");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Cash Flow</h2>
        <p className="mt-1 text-sm text-slate-500">
          Track your business income, expenses and cash balance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Income</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            ₹{totalIncome.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Expenses</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            ₹{totalExpenses.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Cash Balance</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ₹{balance.toFixed(2)}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Record Transaction
        </h3>

        <form onSubmit={recordTransaction} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Transaction Type
            </label>
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as "income" | "expense")
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. Shop rent or other income"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option>General</option>
                <option>Sales</option>
                <option>Rent</option>
                <option>Utilities</option>
                <option>Transport</option>
                <option>Supplies</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Amount (₹)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Enter amount"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-green-700 px-5 py-3 text-sm font-medium text-white hover:bg-green-800 sm:w-auto"
          >
            Record {type === "income" ? "Income" : "Expense"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Transaction History
        </h3>

        {transactions.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No cash transactions recorded yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Description</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Amount</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-slate-100"
                  >
                    <td className="px-3 py-3 whitespace-nowrap">
                      {new Date(transaction.createdAt).toLocaleString("en-IN")}
                    </td>

                    <td className="px-3 py-3">
                      {transaction.description}
                    </td>

                    <td className="px-3 py-3">
                      {transaction.category}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={
                          transaction.type === "income"
                            ? "rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
                            : "rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
                        }
                      >
                        {transaction.type}
                      </span>
                    </td>

                    <td className="px-3 py-3 font-semibold">
                      <span
                        className={
                          transaction.type === "income"
                            ? "text-green-700"
                            : "text-red-600"
                        }
                      >
                        {transaction.type === "income" ? "+" : "-"}₹
                        {transaction.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
