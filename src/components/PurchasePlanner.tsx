
"use client";
import { getPurchaseRecommendations } from "@/lib/ai";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Product, Purchase, PurchaseItem } from "@/types";
import { getProducts, saveProducts } from "@/lib/storage";
import {
  getPurchases,
  savePurchases,
} from "@/lib/purchaseStorage";

export default function PurchasePlanner() {
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [purchases, setPurchases] = useState<Purchase[]>(
    () => getPurchases()
  );
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [aiRecommendation, setAiRecommendation] = useState("");
const [aiLoading, setAiLoading] = useState(false);
const [aiError, setAiError] = useState("");

  // Refresh products and purchases when Firestore updates LocalStorage.
  useEffect(() => {
    function refreshPurchaseData() {
      setProducts(getProducts());
      setPurchases(getPurchases());
    }

    window.addEventListener(
      "zevasewa-data-updated",
      refreshPurchaseData
    );

    return () => {
      window.removeEventListener(
        "zevasewa-data-updated",
        refreshPurchaseData
      );
    };
  }, []);

  const lowStockProducts = products.filter(
    (product) => product.quantity <= product.minStock
  );
async function generateAIRecommendations() {
  setAiLoading(true);
  setAiError("");
  setAiRecommendation("");

  const prompt = `
You are an inventory and purchasing advisor for a small Indian shop.

Analyze the following business inventory and purchase history.

LOW-STOCK PRODUCTS:
${JSON.stringify(
  lowStockProducts.map((product) => ({
    name: product.name,
    category: product.category,
    currentStock: product.quantity,
    unit: product.unit,
    minimumStock: product.minStock,
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    existingSuggestedQuantity: Math.max(
      0,
      product.minStock * 2 - product.quantity
    ),
  })),
  null,
  2
)}

RECENT PURCHASE HISTORY:
${JSON.stringify(
  purchases.slice(0, 10).map((purchase) => ({
    date: purchase.createdAt,
    totalAmount: purchase.totalAmount,
    items: purchase.items,
  })),
  null,
  2
)}

Please provide:
1. Which products should be restocked first and why.
2. A practical suggested purchase quantity for each low-stock product.
3. Estimated purchase cost using the stored purchase prices.
4. Ways to avoid overstocking and manage limited purchasing budgets.

Important:
- Do not invent sales trends, supplier details, or customer demand.
- Explain that recommendations are estimates because demand and supplier lead times are not provided.
- Do not claim purchase cost is business profit or loss.
- Use Indian Rupees (₹).
- Keep the advice clear and practical for a small shopkeeper.
`;

  try {
    const recommendation =
      await getPurchaseRecommendations(prompt);

    if (!recommendation.trim()) {
      throw new Error("The AI returned an empty recommendation.");
    }

    setAiRecommendation(recommendation);
  } catch (error) {
    console.error("AI purchase recommendation failed:", error);
    setAiError(
      "Unable to generate AI advice right now. Your regular restocking suggestions are still available."
    );
  } finally {
    setAiLoading(false);
  }
}
  const estimatedCost = lowStockProducts.reduce((total, product) => {
    const suggestedQuantity = Math.max(
      0,
      product.minStock * 2 - product.quantity
    );

    return total + suggestedQuantity * product.purchasePrice;
  }, 0);

  function recordPurchase(product: Product) {
    setError("");

    const purchaseQuantity = Number(quantities[product.id] ?? "");

    if (!Number.isInteger(purchaseQuantity) || purchaseQuantity <= 0) {
      setError(`Enter a valid whole-number quantity for ${product.name}.`);
      return;
    }

    const item: PurchaseItem = {
      productId: product.id,
      productName: product.name,
      quantity: purchaseQuantity,
      unit: product.unit,
      purchasePrice: product.purchasePrice,
      total: purchaseQuantity * product.purchasePrice,
    };

    const newPurchase: Purchase = {
      id: crypto.randomUUID(),
      items: [item],
      totalAmount: item.total,
      createdAt: new Date().toISOString(),
    };

    const updatedProducts = products.map((currentProduct) =>
      currentProduct.id === product.id
        ? {
            ...currentProduct,
            quantity: currentProduct.quantity + purchaseQuantity,
            updatedAt: new Date().toISOString(),
          }
        : currentProduct
    );

    const updatedPurchases = [newPurchase, ...purchases];

    saveProducts(updatedProducts);
    savePurchases(updatedPurchases);

    setProducts(updatedProducts);
    setPurchases(updatedPurchases);

    setQuantities((previous) => ({
      ...previous,
      [product.id]: "",
    }));
  }

  const totalPurchaseCost = purchases.reduce(
    (total, purchase) => total + purchase.totalAmount,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Purchase Planner
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Find low-stock products and plan your next purchases.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Low Stock Products</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {lowStockProducts.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Estimated Purchase Cost</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ₹{estimatedCost.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Recorded Purchases</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {purchases.length}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Restocking Suggestions
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Suggested quantity aims to bring stock up to twice the minimum
          stock level.
        </p>
        <div className="mt-4">
  <button
    type="button"
    onClick={generateAIRecommendations}
    disabled={aiLoading || lowStockProducts.length === 0}
    className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {aiLoading ? "Analyzing inventory..." : "✨ Get AI Purchase Advice"}
  </button>
</div>

{aiError && (
  <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
    {aiError}
  </p>
)}

{aiRecommendation && (
  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
    <h4 className="mb-3 font-semibold text-emerald-900">
      AI Purchase Recommendations
    </h4>
    <div className="prose prose-sm max-w-none text-slate-700">
      <ReactMarkdown>{aiRecommendation}</ReactMarkdown>
    </div>
  </div>
)}

        {lowStockProducts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-3 text-4xl">✅</div>
            <p className="font-medium text-slate-700">
              All products have sufficient stock.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              No purchases are needed right now.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {lowStockProducts.map((product) => {
              const suggestedQuantity = Math.max(
                0,
                product.minStock * 2 - product.quantity
              );

              return (
                <div
                  key={product.id}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {product.name}
                      </h4>
                      <p className="mt-1 text-sm text-slate-600">
                        Current stock: {product.quantity} {product.unit}
                      </p>
                      <p className="text-sm text-slate-600">
                        Minimum stock: {product.minStock} {product.unit}
                      </p>
                      <p className="mt-2 text-sm font-medium text-amber-800">
                        Suggested purchase: {suggestedQuantity}{" "}
                        {product.unit}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        Estimated cost: ₹
                        {(
                          suggestedQuantity * product.purchasePrice
                        ).toFixed(2)}
                      </p>
                    </div>

                    <div className="w-full sm:w-52">
                      <label className="mb-2 block text-xs font-medium text-slate-600">
                        Purchase quantity ({product.unit})
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={
                          quantities[product.id] ??
                          String(suggestedQuantity)
                        }
                        onChange={(event) =>
                          setQuantities((previous) => ({
                            ...previous,
                            [product.id]: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />

                      <button
                        type="button"
                        onClick={() => recordPurchase(product)}
                        className="mt-3 w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-800"
                      >
                        Record Purchase
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Purchase History
        </h3>

        {purchases.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No purchases recorded yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Quantity</th>
                  <th className="px-3 py-3">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="border-b border-slate-100"
                  >
                    <td className="px-3 py-3">
                      {new Date(purchase.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3">
                      {purchase.items
                        .map((item) => item.productName)
                        .join(", ")}
                    </td>
                    <td className="px-3 py-3">
                      {purchase.items
                        .map((item) => `${item.quantity} ${item.unit}`)
                        .join(", ")}
                    </td>
                    <td className="px-3 py-3 font-semibold">
                      ₹{purchase.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-sm text-slate-500">
          Total recorded purchase cost: ₹{totalPurchaseCost.toFixed(2)}
        </p>
      </section>
    </div>
  );
}
