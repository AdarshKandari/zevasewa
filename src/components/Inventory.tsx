
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types";
import { getProducts, saveProducts } from "@/lib/storage";

const emptyForm = {
  name: "",
  category: "General",
  quantity: "",
  unit: "pcs",
  purchasePrice: "",
  sellingPrice: "",
  minStock: "2",
};

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  // Refresh products when Firestore updates LocalStorage.
  useEffect(() => {
    function refreshProducts() {
      setProducts(getProducts());
    }

    window.addEventListener(
      "zevasewa-data-updated",
      refreshProducts
    );

    return () => {
      window.removeEventListener(
        "zevasewa-data-updated",
        refreshProducts
      );
    };
  }, []);

  function updateProducts(updated: Product[]) {
    setProducts(updated);
    saveProducts(updated);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const quantity = Number(form.quantity);
    const purchasePrice = Number(form.purchasePrice);
    const sellingPrice = Number(form.sellingPrice);
    const minStock = Number(form.minStock);

    if (
      !form.name.trim() ||
      !form.category.trim() ||
      !form.unit.trim() ||
      form.quantity.trim() === "" ||
      form.purchasePrice.trim() === "" ||
      form.sellingPrice.trim() === "" ||
      form.minStock.trim() === "" ||
      !Number.isFinite(quantity) ||
      !Number.isFinite(purchasePrice) ||
      !Number.isFinite(sellingPrice) ||
      !Number.isFinite(minStock) ||
      quantity < 0 ||
      purchasePrice < 0 ||
      sellingPrice < 0 ||
      minStock < 0
    ) {
      setError("Please enter valid product details. Values cannot be negative.");
      return;
    }

    const now = new Date().toISOString();

    if (editingId) {
      const updated = products.map((product) =>
        product.id === editingId
          ? {
              ...product,
              name: form.name.trim(),
              category: form.category.trim(),
              quantity,
              unit: form.unit.trim(),
              purchasePrice,
              sellingPrice,
              minStock,
              updatedAt: now,
            }
          : product
      );

      updateProducts(updated);
    } else {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        category: form.category.trim(),
        quantity,
        unit: form.unit.trim(),
        purchasePrice,
        sellingPrice,
        minStock,
        createdAt: now,
        updatedAt: now,
      };

      updateProducts([...products, newProduct]);
    }

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(product: Product) {
    setForm({
      name: product.name,
      category: product.category,
      quantity: String(product.quantity),
      unit: product.unit,
      purchasePrice: String(product.purchasePrice),
      sellingPrice: String(product.sellingPrice),
      minStock: String(product.minStock),
    });
    setEditingId(product.id);
    setShowForm(true);
    setError("");
  }

  function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    updateProducts(products.filter((product) => product.id !== id));
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      `${product.name} ${product.category}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [products, search]);

  const lowStockCount = products.filter(
    (product) => product.quantity <= product.minStock
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Inventory Management
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Manage your products, prices and available stock.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setError("");
            setShowForm(true);
          }}
          className="rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
        >
          + Add Product
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Products</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {products.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Stock Units</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {products.reduce((total, product) => total + product.quantity, 0)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Low Stock Items</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {lowStockCount}
          </p>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            {editingId ? "Edit Product" : "Add New Product"}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Product Name *
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Rice"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Category *
              <input
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Grocery"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Quantity *
              <input
                required
                type="number"
                min="0"
                step="any"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Unit *
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="litre">Litres</option>
                <option value="ml">Millilitres (ml)</option>
                <option value="box">Boxes</option>
                <option value="pack">Packs</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Purchase Price (₹) *
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm({ ...form, purchasePrice: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Selling Price (₹) *
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.sellingPrice}
                onChange={(e) =>
                  setForm({ ...form, sellingPrice: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Minimum Stock Alert *
              <input
                required
                type="number"
                min="0"
                step="any"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
            >
              {editingId ? "Save Changes" : "Save Product"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name or category..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-green-600"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Product List</h3>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">📦</p>
            <p className="mt-3 font-medium text-slate-700">
              {products.length === 0
                ? "No products added yet"
                : "No matching products found"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first product to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Quantity</th>
                  <th className="px-5 py-4">Purchase Price</th>
                  <th className="px-5 py-4">Selling Price</th>
                  <th className="px-5 py-4">Stock Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const lowStock = product.quantity <= product.minStock;

                  return (
                    <tr key={product.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {product.category}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {product.quantity} {product.unit}
                      </td>

                      <td className="px-5 py-4">
                        ₹{product.purchasePrice.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        ₹{product.sellingPrice.toFixed(2)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            lowStock
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {lowStock ? "Low Stock" : "In Stock"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="font-medium text-blue-700 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="font-medium text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
