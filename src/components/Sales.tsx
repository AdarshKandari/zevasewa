
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product, Sale, SaleItem } from "@/types";
import { getProducts, saveProducts } from "@/lib/storage";
import { getSales, saveSales } from "@/lib/salesStorage";

export default function Sales() {
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [sales, setSales] = useState<Sale[]>(() => getSales());
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");

  // Refresh products and sales when Firestore updates LocalStorage.
  useEffect(() => {
    function refreshSalesData() {
      const latestProducts = getProducts();
      const latestSales = getSales();

      setProducts(latestProducts);
      setSales(latestSales);
    }

    window.addEventListener(
      "zevasewa-data-updated",
      refreshSalesData
    );

    return () => {
      window.removeEventListener(
        "zevasewa-data-updated",
        refreshSalesData
      );
    };
  }, []);

  const selectedProduct = products.find(
    (product) => product.id === productId
  );

  const saleQuantity = Number(quantity);

  const total = useMemo(() => {
    if (!selectedProduct || !Number.isFinite(saleQuantity)) {
      return 0;
    }

    return selectedProduct.sellingPrice * saleQuantity;
  }, [selectedProduct, saleQuantity]);

  function recordSale() {
    setError("");

    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }

    if (!Number.isInteger(saleQuantity) || saleQuantity <= 0) {
      setError("Please enter a valid whole-number quantity.");
      return;
    }

    if (saleQuantity > selectedProduct.quantity) {
      setError("Not enough stock available.");
      return;
    }

    const item: SaleItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: saleQuantity,
      unit: selectedProduct.unit,
      sellingPrice: selectedProduct.sellingPrice,
      total,
    };

    const newSale: Sale = {
      id: crypto.randomUUID(),
      items: [item],
      totalAmount: total,
      createdAt: new Date().toISOString(),
    };

    const updatedProducts = products.map((product) =>
      product.id === selectedProduct.id
        ? {
            ...product,
            quantity: product.quantity - saleQuantity,
            updatedAt: new Date().toISOString(),
          }
        : product
    );

    const updatedSales = [newSale, ...sales];

    saveProducts(updatedProducts);
    saveSales(updatedSales);

    setProducts(updatedProducts);
    setSales(updatedSales);
    setProductId("");
    setQuantity("1");
  }

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Sales Management
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Record sales and automatically update your inventory.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Sales</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {sales.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            ₹{totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Record a Sale
        </h3>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Select Product
            </label>

            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="">Choose a product</option>
              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                  disabled={product.quantity <= 0}
                >
                  {product.name} — Stock: {product.quantity} {product.unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Quantity
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>
        </div>

        {selectedProduct && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-slate-500">Selling Price</span>
              <span className="font-medium">
                ₹{selectedProduct.sellingPrice.toFixed(2)} /{" "}
                {selectedProduct.unit}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="text-slate-500">Available Stock</span>
              <span className="font-medium">
                {selectedProduct.quantity} {selectedProduct.unit}
              </span>
            </div>

            <div className="mt-4 flex justify-between border-t border-slate-200 pt-4">
              <span className="font-semibold">Sale Total</span>
              <span className="text-xl font-bold text-green-700">
                ₹{total.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={recordSale}
          disabled={!selectedProduct}
          className="mt-5 rounded-xl bg-green-700 px-6 py-3 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Record Sale
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Sales History
        </h3>

        {sales.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No sales recorded yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Quantity</th>
                  <th className="px-3 py-3">Total</th>
                </tr>
              </thead>

              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      {new Date(sale.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3">
                      {sale.items.map((item) => item.productName).join(", ")}
                    </td>
                    <td className="px-3 py-3">
                      {sale.items
                        .map((item) => `${item.quantity} ${item.unit}`)
                        .join(", ")}
                    </td>
                    <td className="px-3 py-3 font-semibold">
                      ₹{sale.totalAmount.toFixed(2)}
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
