
"use client";

import { useMemo, useState } from "react";
import type {
  Product,
  Sale,
  Purchase,
  CashTransaction,
} from "@/types";
import ReactMarkdown from "react-markdown";
import { getProducts } from "@/lib/storage";
import { getSales } from "@/lib/salesStorage";
import { getPurchases } from "@/lib/purchaseStorage";
import { getCashTransactions } from "@/lib/cashStorage";
import { geminiModel } from "@/lib/ai";

export default function AIAssistant() {
  const [products] = useState<Product[]>(() => getProducts());
  const [sales] = useState<Sale[]>(() => getSales());
  const [purchases] = useState<Purchase[]>(() => getPurchases());
  const [cashTransactions] = useState<CashTransaction[]>(() =>
    getCashTransactions()
  );

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );

  const totalPurchaseCost = purchases.reduce(
    (sum, purchase) => sum + purchase.totalAmount,
    0
  );

  const totalIncome = cashTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpenses = cashTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const cashBalance = totalIncome - totalExpenses;

  const lowStockProducts = products.filter(
    (product) => product.quantity <= product.minStock
  );

  const bestSellingProducts = useMemo(() => {
    const totals = new Map<string, number>();

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        totals.set(
          item.productName,
          (totals.get(item.productName) || 0) + item.quantity
        );
      });
    });

    return Array.from(totals.entries()).sort(
      (a, b) => b[1] - a[1]
    );
  }, [sales]);

  const suggestions = [
    {
      title: "Business Summary",
      description: "Review your sales, revenue and business activity.",
      question: "Give me a business summary.",
      icon: "📊",
    },
    {
      title: "Sales Insights",
      description: "Understand your recorded sales and best-selling products.",
      question: "Show my sales insights and trends.",
      icon: "🛒",
    },
    {
      title: "Stock Alerts",
      description: "Find products that need restocking.",
      question: "Which products need restocking?",
      icon: "⚠️",
    },
    {
      title: "Purchase Advice",
      description: "Estimate the cost of replenishing low-stock products.",
      question: "Give me purchase recommendations.",
      icon: "📦",
    },
  ];

  function generateLocalAnswer(userQuestion: string): string {
    const q = userQuestion.toLowerCase().trim();

    if (
      q.includes("stock") ||
      q.includes("restock") ||
      q.includes("inventory")
    ) {
      if (lowStockProducts.length === 0) {
        return `Your inventory has ${products.length} products. No products are currently at or below their minimum stock level.`;
      }

      const details = lowStockProducts
        .map(
          (product) =>
            `${product.name}: ${product.quantity} ${product.unit} available (minimum: ${product.minStock} ${product.unit})`
        )
        .join("\n");

      return `You have ${lowStockProducts.length} product(s) that need attention:\n\n${details}\n\nConsider restocking these products.`;
    }

    if (
      q.includes("purchase") ||
      q.includes("buy") ||
      q.includes("replenish")
    ) {
      if (lowStockProducts.length === 0) {
        return "No immediate purchase recommendations. Your products are currently above their minimum stock levels.";
      }

      const recommendations = lowStockProducts.map((product) => {
        const suggestedQuantity = Math.max(
          0,
          product.minStock * 2 - product.quantity
        );

        const estimatedCost =
          suggestedQuantity * product.purchasePrice;

        return `${product.name}: Consider buying ${suggestedQuantity} ${product.unit}. Estimated cost: ₹${estimatedCost.toFixed(2)}.`;
      });

      return `Here are your purchase recommendations:\n\n${recommendations.join("\n\n")}\n\nThese are estimates. Adjust quantities based on actual demand.`;
    }

    if (
      q.includes("sale") ||
      q.includes("revenue") ||
      q.includes("selling") ||
      q.includes("best")
    ) {
      const bestProduct = bestSellingProducts[0];

      return `Your recorded sales:\n\nTotal sales: ${sales.length}\nTotal revenue: ₹${totalRevenue.toFixed(2)}\n\n${
        bestProduct
          ? `Best-selling product by recorded quantity: ${bestProduct[0]} (${bestProduct[1]} units).`
          : "No sales have been recorded yet."
      }\n\nThis summary uses all recorded sales, not only today's sales.`;
    }

    if (
      q.includes("cash") ||
      q.includes("balance") ||
      q.includes("income") ||
      q.includes("expense")
    ) {
      return `Your cash flow summary:\n\nTotal cash income: ₹${totalIncome.toFixed(2)}\nTotal cash expenses: ₹${totalExpenses.toFixed(2)}\nCurrent recorded cash balance: ₹${cashBalance.toFixed(2)}`;
    }

    if (
      q.includes("summary") ||
      q.includes("business") ||
      q.includes("overview")
    ) {
      return `Here is your business summary:\n\nProducts in inventory: ${products.length}\nRecorded sales: ${sales.length}\nSales revenue: ₹${totalRevenue.toFixed(2)}\nRecorded purchases: ${purchases.length}\nPurchase cost: ₹${totalPurchaseCost.toFixed(2)}\nLow-stock products: ${lowStockProducts.length}\nCash balance: ₹${cashBalance.toFixed(2)}\n\nKeep monitoring your stock levels and recording every transaction to maintain accurate records.`;
    }

    return "I can help with your business summary, sales, revenue, inventory, low-stock products, purchase recommendations and cash flow.";
  }

  async function generateAnswer(userQuestion: string) {
    const trimmedQuestion = userQuestion.trim();

    if (!trimmedQuestion) {
      setAnswer("Please enter a question first.");
      return;
    }

    if (loading) return;

    setLoading(true);
    setError("");
    setAnswer("");

    const businessContext = {
      currency: "INR",
      inventory: products.map((product) => ({
        name: product.name,
        category: product.category,
        quantity: product.quantity,
        unit: product.unit,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        minimumStock: product.minStock,
      })),
      salesSummary: {
        numberOfSales: sales.length,
        totalRevenue,
        bestSellingProducts: bestSellingProducts.slice(0, 10).map(
          ([name, quantity]) => ({
            name,
            quantitySold: quantity,
          })
        ),
        recentSales: sales.slice(-10).map((sale) => ({
          date: sale.createdAt,
          totalAmount: sale.totalAmount,
          items: sale.items.map((item) => ({
            product: item.productName,
            quantity: item.quantity,
            unit: item.unit,
            total: item.total,
          })),
        })),
      },
      purchaseSummary: {
        numberOfPurchases: purchases.length,
        totalPurchaseCost,
        recentPurchases: purchases.slice(-10).map((purchase) => ({
          date: purchase.createdAt,
          totalAmount: purchase.totalAmount,
          items: purchase.items.map((item) => ({
            product: item.productName,
            quantity: item.quantity,
            unit: item.unit,
            total: item.total,
          })),
        })),
      },
      cashFlow: {
        totalIncome,
        totalExpenses,
        balance: cashBalance,
        recentTransactions: cashTransactions.slice(-20).map((item) => ({
          type: item.type,
          description: item.description,
          category: item.category,
          amount: item.amount,
          date: item.createdAt,
        })),
      },
      lowStockProducts: lowStockProducts.map((product) => ({
        name: product.name,
        quantity: product.quantity,
        unit: product.unit,
        minimumStock: product.minStock,
        purchasePrice: product.purchasePrice,
      })),
    };

    const prompt = `
You are ZevaSewa AI, a trustworthy and practical business assistant for small shopkeepers in India.

Your job is to help the shopkeeper understand their recorded business data and make sensible business decisions.

IMPORTANT ACCOUNTING RULES:

1. SALES REVENUE IS NOT PROFIT.
   - Sales revenue is the total value of recorded sales.
   - Never describe sales revenue as net profit or earnings.
   - Do not assume that revenue is money available as cash.

2. CASH FLOW IS NOT PROFIT.
   - Cash balance = recorded cash income minus recorded cash expenses.
   - Describe this only as the recorded cash balance.
   - Do not call it business profit.
   - Do not assume all sales have been entered as cash income.

3. PURCHASE COST IS NOT THE SAME AS COST OF GOODS SOLD.
   - Total purchase cost represents recorded purchases.
   - Do not subtract all purchases from sales revenue to calculate profit.
   - Do not calculate net profit unless reliable cost of goods sold and all relevant expenses are available.

4. PROFIT CALCULATIONS:
   - Only calculate profit when the required cost and expense information is reliably available.
   - Current inventory purchase prices may not represent the historical cost of products sold.
   - If the information is insufficient, clearly state that actual profit cannot be determined from the available records.
   - You may explain what additional information is needed.

5. RECORDED FACTS AND RECOMMENDATIONS:
   - Clearly separate recorded facts, estimates and recommendations.
   - Never invent products, quantities, prices, dates or transactions.
   - Clearly label estimates and explain their assumptions.
   - If information is missing, say so.
   - Do not present suggestions as confirmed business results.

6. TEST DATA:
   - Some records may contain labels such as "Test", "Sync Test" or "Dashboard Test".
   - Point out records that appear to be test entries when relevant.
   - Do not automatically assume every such record is fake.
   - Do not recommend deleting records automatically.
   - Suggest reviewing and categorising questionable entries before using reports for actual business decisions.

7. INVENTORY:
   - Use the recorded stock quantities and minimum stock levels.
   - A product is low-stock when its quantity is less than or equal to its minimum stock level.
   - Purchase quantities and costs suggested by you are estimates, not confirmed orders.
   - Never claim that stock has been changed or a purchase has been made.

8. RESPONSE STYLE:
   - Be friendly, professional and easy to understand.
   - Use Indian Rupees (₹).
   - Give practical advice suitable for small Indian shops.
   - Use headings, short paragraphs and bullet points.
   - Avoid unnecessary technical or accounting jargon.
   - Do not claim to have recorded transactions or changed any business data.
   - When asked for recommendations, explain why each recommendation may help.

BUSINESS DATA:
${JSON.stringify(businessContext, null, 2)}

USER QUESTION:
${trimmedQuestion}

Answer using only the supplied business data. Be accurate, transparent and practical.
`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const responseText = result.response.text();

      if (!responseText.trim()) {
        throw new Error("Gemini returned an empty response.");
      }

      setAnswer(responseText);
    } catch (err) {
      console.error("Gemini request failed:", err);

      setError(
        err instanceof Error
          ? `Gemini AI could not respond: ${err.message}`
          : "Gemini AI could not respond because of an unexpected error. Showing the local assistant response instead."
      );

      setAnswer(generateLocalAnswer(trimmedQuestion));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-green-800 to-green-600 p-6 text-white sm:p-8">
        <div className="text-4xl">✨</div>
        <h2 className="mt-3 text-2xl font-bold">
          ZevaSewa AI Assistant
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-green-50">
          Your intelligent business assistant, powered by Gemini.
          Get business summaries, sales insights, stock alerts and
          practical recommendations.
        </p>
        <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
          ● Gemini AI · Cloud-powered
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Sales Revenue</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            ₹{totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Products</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {products.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Low Stock Alerts</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {lowStockProducts.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Cash Balance</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ₹{cashBalance.toFixed(2)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Business Insights
        </h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {suggestions.map((item) => (
            <button
              key={item.title}
              type="button"
              disabled={loading}
              onClick={() => {
                setQuestion(item.question);
                void generateAnswer(item.question);
              }}
              className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-green-500 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-2xl">{item.icon}</span>
              <h4 className="mt-2 font-semibold text-slate-900">
                {item.title}
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                {item.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Ask Your Business Assistant
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Ask questions in natural language about your recorded business data.
        </p>

        <form
          className="mt-5 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void generateAnswer(question);
          }}
        >
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: Which products need restocking, and how much should I buy?"
            rows={3}
            disabled={loading}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-green-700 px-6 py-3 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Thinking..." : "✨ Ask Gemini AI"}
          </button>
        </form>

        {loading && (
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-green-50 p-4 text-sm text-green-800">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-200 border-t-green-700" />
            Gemini is analysing your question and business data...
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {error}
            <p className="mt-2 text-xs">
              The response below is from the local rule-based assistant.
            </p>
          </div>
        )}

        {answer && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-5">
            <h4 className="font-semibold text-green-900">
              ✨ Assistant Response
            </h4>
           <div className="prose prose-sm mt-3 max-w-none text-slate-700">
  <ReactMarkdown
    components={{
      h1: ({ children }) => (
        <h1 className="mb-3 mt-5 text-xl font-bold text-green-900">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="mb-2 mt-5 text-lg font-bold text-green-900">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="mb-2 mt-4 text-base font-semibold text-green-800">
          {children}
        </h3>
      ),
      p: ({ children }) => (
        <p className="mb-3 text-sm leading-7 text-slate-700">
          {children}
        </p>
      ),
      ul: ({ children }) => (
        <ul className="mb-4 list-disc space-y-2 pl-6 text-sm text-slate-700">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="mb-4 list-decimal space-y-2 pl-6 text-sm text-slate-700">
          {children}
        </ol>
      ),
      strong: ({ children }) => (
        <strong className="font-semibold text-slate-900">
          {children}
        </strong>
      ),
    }}
  >
    {answer}
  </ReactMarkdown>
</div>
          </div>
        )}
      </section>

      <p className="text-center text-xs leading-5 text-slate-400">
        Gemini AI processes your question and the business summary
        shown to it through Google&apos;s cloud service. Do not include
        passwords, payment details or other sensitive personal information.
        If Gemini is unavailable, ZevaSewa uses its local assistant as a fallback.
      </p>
    </div>
  );
}
