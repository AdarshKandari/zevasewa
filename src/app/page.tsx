"use client";
import "@/lib/firebase";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

import Inventory from "@/components/Inventory";
import Sales from "@/components/Sales";
import PurchasePlanner from "@/components/PurchasePlanner";
import CashFlow from "@/components/CashFlow";
import BackupRestore from "@/components/BackupRestore";
import AIAssistant from "@/components/AIAssistant";

import type { Product, Sale, Purchase, CashTransaction } from "@/types";

import { getProducts } from "@/lib/storage";
import { getSales } from "@/lib/salesStorage";
import { getPurchases } from "@/lib/purchaseStorage";
import { getCashTransactions } from "@/lib/cashStorage";

type PageName =
  | "Dashboard"
  | "Inventory"
  | "Sales"
  | "Purchase Planner"
  | "Cash Flow"
  | "Backup & Restore"
  | "AI Assistant";

type RecentTransaction = {
  id: string;
  name: string;
  type: "Sale" | "Purchase" | "Cash Income" | "Cash Expense";
  amount: number;
  date: string;
};

const navigation: { name: PageName; icon: string }[] = [
  { name: "Dashboard", icon: "⌂" },
  { name: "Inventory", icon: "⬡" },
  { name: "Sales", icon: "🛒" },
  { name: "Purchase Planner", icon: "▤" },
  { name: "Cash Flow", icon: "₹" },
  { name: "Backup & Restore", icon: "▣" },
  { name: "AI Assistant", icon: "✦" },
];

const currency = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function StoreIllustration() {
  return (
    <svg
      viewBox="0 0 310 170"
      role="img"
      aria-label="Illustration of a small shop"
      className="h-auto w-full max-w-[290px]"
    >
      <ellipse cx="154" cy="151" rx="137" ry="12" fill="#b7ead5" opacity=".55" />
      <path d="M28 111h253v38H28z" fill="#c6f0dc" />
      <path d="M66 63h177v85H66z" fill="#fff8eb" stroke="#9acbb5" strokeWidth="2" />
      <path d="M56 62 78 25h153l24 37z" fill="#e9f7ef" stroke="#8ac5a9" strokeWidth="2" />
      <path d="M77 25h154l-8 19H87z" fill="#0b8b5b" />
      <path d="M64 61h190v17H64z" fill="#fff" stroke="#8ac5a9" strokeWidth="2" />
      <path d="M64 61h32v17H64zM128 61h32v17h-32zM192 61h32v17h-32z" fill="#f28b55" />
      <path d="M96 78v70M128 78v70M160 78v70M192 78v70M224 78v70" stroke="#d8eadf" strokeWidth="2" />
      <rect x="132" y="91" width="44" height="57" rx="3" fill="#8ed8b5" stroke="#3c9b72" strokeWidth="2" />
      <path d="M154 91v57" stroke="#3c9b72" strokeWidth="2" />
      <circle cx="169" cy="120" r="2" fill="#087a50" />
      <rect x="83" y="91" width="34" height="27" rx="3" fill="#d7f2e5" stroke="#8ac5a9" />
      <rect x="191" y="91" width="34" height="27" rx="3" fill="#d7f2e5" stroke="#8ac5a9" />
      <path d="M20 130c0-23 13-39 27-39s27 16 27 39" fill="#8bd5a9" />
      <path d="M14 130c0-17 9-29 19-29s19 12 19 29" fill="#45b77c" />
      <path d="M244 130c0-24 13-41 28-41s28 17 28 41" fill="#8bd5a9" />
      <path d="M258 130c0-18 9-30 19-30s19 12 19 30" fill="#45b77c" />
      <path d="M31 91c-2-13 5-23 16-24 8 0 15 7 15 17-11-4-20-1-31 7zM260 89c-2-13 5-23 16-24 8 0 15 7 15 17-11-4-20-1-31 7z" fill="#15965d" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden="true">
      <path d="M7 35V25h8v10H7Zm13 0V16h8v19h-8Zm13 0V8h8v27h-8Z" fill="currentColor" opacity=".25" />
      <path d="m7 20 11-7 9 3L41 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M33 5h8v8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const [activePage, setActivePage] = useState<PageName>("Dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [searchText, setSearchText] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 90>(7);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    function refreshDashboard() {
      setProducts(getProducts());
      setSales(getSales());
      setPurchases(getPurchases());
      setCashTransactions(getCashTransactions());
    }

    refreshDashboard();
    window.addEventListener("storage", refreshDashboard);
    window.addEventListener("focus", refreshDashboard);
    window.addEventListener("zevasewa-data-updated", refreshDashboard);
    document.addEventListener("visibilitychange", refreshDashboard);

    return () => {
      window.removeEventListener("storage", refreshDashboard);
      window.removeEventListener("focus", refreshDashboard);
      window.removeEventListener("zevasewa-data-updated", refreshDashboard);
      document.removeEventListener("visibilitychange", refreshDashboard);
    };
  }, []);

  const today = new Date().toDateString();
  const todaySales = sales
    .filter((sale) => new Date(sale.createdAt).toDateString() === today)
    .reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const lowStockCount = products.filter((product) => product.quantity <= product.minStock).length;
  const totalIncome = cashTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = cashTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const cashBalance = totalIncome - totalExpenses;
  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);

  const recentTransactions = useMemo<RecentTransaction[]>(() => {
    const saleRows: RecentTransaction[] = sales.map((sale) => ({
      id: `sale-${sale.id}`,
      name: sale.items.map((item) => item.productName).join(", ") || "Customer sale",
      type: "Sale",
      amount: sale.totalAmount,
      date: sale.createdAt,
    }));
    const purchaseRows: RecentTransaction[] = purchases.map((purchase) => ({
      id: `purchase-${purchase.id}`,
      name: purchase.items.map((item) => item.productName).join(", ") || "Stock purchase",
      type: "Purchase",
      amount: -purchase.totalAmount,
      date: purchase.createdAt,
    }));
    const cashRows: RecentTransaction[] = cashTransactions.map((item) => ({
      id: `cash-${item.id}`,
      name: item.description || (item.type === "income" ? "Cash income" : "Cash expense"),
      type: item.type === "income" ? "Cash Income" : "Cash Expense",
      amount: item.type === "income" ? item.amount : -item.amount,
      date: item.createdAt,
    }));
    return [...saleRows, ...purchaseRows, ...cashRows]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [sales, purchases, cashTransactions]);

  const chartData = useMemo(() => {
    const now = new Date();
    const bucketCount = 7;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (chartPeriod - 1));
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const bucketStart = new Date(start);
      bucketStart.setDate(start.getDate() + Math.floor((chartPeriod / bucketCount) * index));
      const nextStart = new Date(start);
      nextStart.setDate(start.getDate() + Math.floor((chartPeriod / bucketCount) * (index + 1)));
      return {
        label:
          chartPeriod === 7
            ? bucketStart.toLocaleDateString("en-IN", { weekday: "short" })
            : bucketStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        amount: sales
          .filter((sale) => {
            const saleDate = new Date(sale.createdAt);
            return saleDate >= bucketStart && (index === bucketCount - 1 ? saleDate <= now : saleDate < nextStart);
          })
          .reduce((sum, sale) => sum + sale.totalAmount, 0),
      };
    });
    return buckets;
  }, [sales, chartPeriod]);

  const chartMax = Math.max(...chartData.map((day) => day.amount), 100);
  const chartPoints = chartData
    .map((day, index) => {
      const x = 28 + index * 55;
      const y = 132 - (day.amount / chartMax) * 104;
      return `${x},${y}`;
    })
    .join(" ");
  const chartArea = `28,132 ${chartPoints} 358,132`;

  const searchResults = searchText.trim()
    ? products
        .filter((product) => product.name.toLowerCase().includes(searchText.trim().toLowerCase()))
        .slice(0, 4)
    : [];

  const stats = [
    {
      title: "Total Products",
      value: products.length.toString(),
      icon: "⬡",
      tone: "blue",
      note: "View inventory",
      action: "Inventory" as PageName,
    },
    {
      title: "Today's Sales",
      value: currency(todaySales),
      icon: "🛒",
      tone: "green",
      note: "View sales",
      action: "Sales" as PageName,
    },
    {
      title: "Low Stock Items",
      value: lowStockCount.toString(),
      icon: "⚠",
      tone: "amber",
      note: lowStockCount ? "Needs attention" : "All good!",
      action: "Inventory" as PageName,
    },
    {
      title: "Cash Balance",
      value: currency(cashBalance),
      icon: "₹",
      tone: "purple",
      note: "View cash flow",
      action: "Cash Flow" as PageName,
    },
  ];

  function renderDashboard() {
    return (
      <div className="space-y-6">
        <section className="relative min-h-[178px] overflow-hidden rounded-[28px] bg-gradient-to-r from-[#eaf2ff] via-[#f3fbf7] to-[#e3f8ed] px-6 py-6 sm:px-8">
          <div className="pointer-events-none absolute -right-8 -top-20 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute right-[28%] top-0 h-40 w-40 rounded-full bg-white/80 blur-3xl" />
          <div className="relative z-10 max-w-[620px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Your business workspace
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-[38px]">
              Welcome back! <span aria-hidden="true">👋</span>
            </h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>
          <div className="absolute bottom-0 right-2 hidden w-[34%] items-end justify-center md:flex">
            <StoreIllustration />
          </div>
          <div className="absolute right-[23%] top-5 hidden rounded-3xl border border-white/80 bg-white/65 px-4 py-3 shadow-sm backdrop-blur md:flex md:items-center md:gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-xl text-white">✓</span>
            <span>
              <span className="block text-sm font-bold text-slate-900">Local Mode</span>
              <span className="mt-0.5 block text-xs text-slate-600">Data stored on this device</span>
            </span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {stats.map((stat) => (
            <button
              key={stat.title}
              type="button"
              onClick={() => setActivePage(stat.action)}
              className="group relative min-h-[155px] overflow-hidden rounded-[22px] border border-white bg-white/95 p-5 text-left shadow-[0_8px_24px_rgba(31,74,99,0.08)] transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(31,74,99,0.13)]"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-inner ${
                stat.tone === "blue" ? "bg-blue-100 text-blue-700" :
                stat.tone === "green" ? "bg-emerald-100 text-emerald-700" :
                stat.tone === "amber" ? "bg-amber-100 text-amber-700" :
                "bg-violet-100 text-violet-700"
              }`}>
                {stat.icon}
              </div>
              <p className="absolute left-[88px] top-7 text-sm font-medium text-slate-600">{stat.title}</p>
              <p className="mt-1 pl-[68px] text-[26px] font-extrabold tracking-tight text-slate-950 sm:text-[29px]">{stat.value}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs font-semibold ${
                  stat.tone === "amber" && lowStockCount > 0 ? "text-amber-700" : "text-emerald-700"
                }`}>{stat.note}</span>
                <span className="text-lg text-emerald-700 transition group-hover:translate-x-1">→</span>
              </div>
              <div className={`pointer-events-none absolute -bottom-5 right-3 h-20 w-20 rounded-full opacity-50 blur-2xl ${
                stat.tone === "blue" ? "bg-blue-200" :
                stat.tone === "green" ? "bg-emerald-200" :
                stat.tone === "amber" ? "bg-amber-200" : "bg-violet-200"
              }`} />
            </button>
          ))}
        </section>

        <section className="grid gap-4 2xl:grid-cols-[1.42fr_0.92fr_1.08fr]">
          <div className="rounded-[24px] border border-white bg-white/95 p-5 shadow-[0_8px_24px_rgba(31,74,99,0.07)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><TrendIcon /></span>
                <h3 className="text-lg font-bold tracking-tight text-slate-950">Sales Overview</h3>
              </div>
              <div className="flex rounded-xl bg-slate-50 p-1">
                {([7, 30, 90] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setChartPeriod(period)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      chartPeriod === period ? "bg-emerald-600 text-white shadow" : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    {period}D
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="text-[28px] font-extrabold tracking-tight text-slate-950">
                {currency(chartData.reduce((sum, day) => sum + day.amount, 0))}
              </p>
              <span className="text-xs font-semibold text-emerald-700">↑ Sales recorded</span>
              <span className="text-xs text-slate-500">in the last {chartPeriod} days</span>
            </div>
            <div className="mt-4">
              <svg viewBox="0 0 390 160" role="img" aria-label={`Sales chart for the last ${chartPeriod} days`} className="h-[172px] w-full overflow-visible">
                {[28, 62, 96, 132].map((y) => (
                  <line key={y} x1="28" y1={y} x2="358" y2={y} stroke="#e8eef4" strokeWidth="1" />
                ))}
                {[28, 83, 138, 193, 248, 303, 358].map((x) => (
                  <line key={x} x1={x} y1="20" x2={x} y2="132" stroke="#eef3f7" strokeWidth="1" />
                ))}
                <polygon points={chartArea} fill="url(#salesFill)" />
                <defs>
                  <linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10a66b" stopOpacity=".24" />
                    <stop offset="100%" stopColor="#10a66b" stopOpacity=".02" />
                  </linearGradient>
                </defs>
                <polyline points={chartPoints} fill="none" stroke="#07965d" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                {chartData.map((day, index) => {
                  const x = 28 + index * 55;
                  const y = 132 - (day.amount / chartMax) * 104;
                  return <circle key={`${day.label}-${index}`} cx={x} cy={y} r="5" fill="#07965d" stroke="white" strokeWidth="2.5" />;
                })}
              </svg>
              <div className="mt-1 grid grid-cols-7 text-center">
                {chartData.map((day, index) => (
                  <span key={`${day.label}-${index}`} className="text-[11px] font-medium text-slate-500">{day.label}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white bg-white/95 p-5 shadow-[0_8px_24px_rgba(31,74,99,0.07)] sm:p-6">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl text-emerald-700">◷</span>
                <h3 className="text-lg font-bold text-slate-950">Recent Activity</h3>
              </div>
              <button type="button" onClick={() => setActivePage("Sales")} className="text-xs font-bold text-emerald-700 hover:text-emerald-900">View All →</button>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                <span className="text-3xl">▤</span>
                <p className="mt-3 text-sm font-semibold text-slate-800">No activity yet</p>
                <p className="mt-1 text-xs text-slate-500">Your latest business activity will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTransactions.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-4">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${
                      item.type === "Sale" ? "bg-emerald-100 text-emerald-700" :
                      item.type === "Purchase" ? "bg-orange-100 text-orange-600" :
                      item.type === "Cash Income" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    }`}>
                      {item.type === "Sale" ? "🛒" : item.type === "Purchase" ? "🛒" : item.type === "Cash Income" ? "▤" : "↗"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.type}{item.name ? ` · ${item.name}` : ""}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(item.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-slate-900">{currency(Math.abs(item.amount))}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex min-h-[300px] flex-col overflow-hidden rounded-[24px] bg-gradient-to-br from-[#003e31] via-[#006345] to-[#008a5d] p-6 text-white shadow-[0_12px_28px_rgba(0,91,61,0.2)]">
            <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full border border-emerald-200/20" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-emerald-300/20 to-transparent" />
            <div className="relative z-10 flex items-center gap-2 text-2xl text-emerald-100">✦ <span className="text-sm font-semibold tracking-wide text-emerald-100">SMART BUSINESS SUPPORT</span></div>
            <h3 className="relative z-10 mt-5 text-[25px] font-extrabold leading-tight">ZevaSewa<br />AI Assistant</h3>
            <p className="relative z-10 mt-3 max-w-[220px] text-sm leading-6 text-emerald-50">
              Get insights, recommendations and answers about your business.
            </p>
            <div className="pointer-events-none absolute bottom-7 right-4 flex h-36 w-32 items-center justify-center">
              <div className="absolute h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-[35px] border border-cyan-100/70 bg-gradient-to-br from-sky-200 to-blue-500 text-5xl shadow-[0_0_35px_rgba(34,211,238,.35)]">🤖</div>
              <span className="absolute -right-1 bottom-0 text-3xl text-cyan-200">↗</span>
            </div>
            <button type="button" onClick={() => setActivePage("AI Assistant")} className="relative z-10 mt-auto w-fit rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50">
              Ask Now <span className="ml-1">→</span>
            </button>
          </div>
        </section>

        <section className="grid gap-4 2xl:grid-cols-[1.25fr_1.05fr_1.05fr]">
          <div className="rounded-[24px] border border-white bg-white/95 p-5 shadow-[0_8px_24px_rgba(31,74,99,0.07)]">
            <div className="flex items-center gap-3">
              <span className="text-2xl text-emerald-600">ϟ</span>
              <h3 className="text-lg font-bold text-slate-950">Quick Actions</h3>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <button type="button" onClick={() => setActivePage("Inventory")} className="flex min-h-[104px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-3 text-center text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-1">
                <span className="text-2xl">⬡</span><span className="mt-2 text-xs font-bold">＋ Add<br />Product</span>
              </button>
              <button type="button" onClick={() => setActivePage("Sales")} className="flex min-h-[104px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-3 text-center text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-1">
                <span className="text-2xl">🛒</span><span className="mt-2 text-xs font-bold">＋ Record<br />Sale</span>
              </button>
              <button type="button" onClick={() => setActivePage("Purchase Planner")} className="flex min-h-[104px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-3 text-center text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-1">
                <span className="text-2xl">▤</span><span className="mt-2 text-xs font-bold">＋ Plan<br />Purchase</span>
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-white bg-white/95 p-5 shadow-[0_8px_24px_rgba(31,74,99,0.07)]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3"><span className="text-2xl text-amber-500">♧</span><h3 className="text-lg font-bold text-slate-950">Business Insights</h3></div>
              <button type="button" onClick={() => setActivePage("AI Assistant")} className="text-xs font-bold text-emerald-700">View Details →</button>
            </div>
            <div className="mt-5 flex min-h-[104px] items-center gap-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><TrendIcon /></span>
              <div>
                <p className="text-sm font-bold text-slate-900">{totalRevenue > 0 ? "Your business is making sales!" : "Your business journey starts here"}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{totalRevenue > 0 ? `${currency(totalRevenue)} total recorded sales revenue across ${sales.length} sale${sales.length === 1 ? "" : "s"}.` : "Record your first sale to start seeing business insights here."}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white bg-white/95 p-5 shadow-[0_8px_24px_rgba(31,74,99,0.07)]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3"><span className="text-2xl text-amber-500">⚠</span><h3 className="text-lg font-bold text-slate-950">Stock Alert</h3></div>
              <button type="button" onClick={() => setActivePage("Inventory")} className="text-xs font-bold text-sky-700">View All →</button>
            </div>
            <div className={`mt-5 flex min-h-[104px] items-center gap-4 rounded-2xl p-4 ${lowStockCount > 0 ? "bg-amber-50" : "bg-emerald-50"}`}>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl text-white ${lowStockCount > 0 ? "bg-amber-500" : "bg-emerald-600"}`}>{lowStockCount > 0 ? "!" : "✓"}</span>
              <div>
                <p className="text-sm font-bold text-slate-900">{lowStockCount > 0 ? `${lowStockCount} item${lowStockCount === 1 ? "" : "s"} need attention` : "No low stock items"}</p>
                <p className="mt-1 text-xs text-slate-600">{lowStockCount > 0 ? "Review your inventory and plan a purchase." : "All your products are well stocked."}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white bg-white/80 p-4"><p className="text-xs font-medium text-slate-500">Total Sales Revenue</p><p className="mt-1 text-lg font-extrabold text-slate-900">{currency(totalRevenue)}</p></div>
          <div className="rounded-2xl border border-white bg-white/80 p-4"><p className="text-xs font-medium text-slate-500">Total Purchases</p><p className="mt-1 text-lg font-extrabold text-slate-900">{currency(totalPurchases)}</p></div>
          <div className="rounded-2xl border border-white bg-white/80 p-4"><p className="text-xs font-medium text-slate-500">Cash Expenses</p><p className="mt-1 text-lg font-extrabold text-slate-900">{currency(totalExpenses)}</p></div>
        </section>
      </div>
    );
  }
 if (authLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f8f7]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
          <p className="text-sm font-medium text-slate-600">
            Checking your account...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#edf4ff_0%,#f5fbf8_48%,#eff7ff_100%)] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[282px] shrink-0 flex-col overflow-hidden bg-gradient-to-b from-[#003b30] via-[#00382e] to-[#002b25] text-white shadow-[8px_0_30px_rgba(0,50,40,.12)] md:flex">
          <div className="flex items-center gap-3 px-7 py-7">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-emerald-500 text-3xl font-black text-emerald-950 shadow-[0_0_24px_rgba(16,185,129,.25)]">Z</div>
            <div><h1 className="text-[22px] font-extrabold tracking-tight">ZevaSewa</h1><p className="mt-0.5 text-[11px] text-emerald-100/80">Smart Business Manager</p></div>
          </div>
          <div className="px-5 pt-5 pb-3"><p className="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300/70">Workspace</p></div>
          <nav className="flex-1 space-y-2 overflow-y-auto px-5">
            {navigation.map((item) => (
              <button key={item.name} type="button" onClick={() => setActivePage(item.name)} className={`group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-[15px] font-semibold transition ${
                activePage === item.name
                  ? "border border-emerald-300/40 bg-gradient-to-r from-emerald-500/90 to-emerald-600/60 text-white shadow-[0_8px_22px_rgba(0,0,0,.15)]"
                  : "text-emerald-50/90 hover:bg-white/10 hover:text-white"
              }`}>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl ${activePage === item.name ? "bg-white/15" : "bg-white/5 group-hover:bg-white/10"}`}>{item.icon}</span>
                {item.name}
                {activePage === item.name && <span className="ml-auto h-2 w-2 rounded-full bg-white" />}
              </button>
            ))}
          </nav>
          <div className="p-5">
            <div className="rounded-[20px] border border-emerald-400/30 bg-emerald-400/10 p-4">
              <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" /><span className="text-sm font-bold">Local Mode</span></div>
              <p className="mt-2 pl-6 text-xs leading-5 text-emerald-100/80">Your data stays<br />on this device</p>
            </div>
            <p className="mt-8 px-2 text-[11px] text-emerald-100/60">v0.1.0&nbsp; • &nbsp;ZevaSewa</p>
          </div>
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-80 rotate-[-12deg] rounded-[50%] border-t-2 border-emerald-500/50 bg-emerald-500/10" />
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-white/75 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-full max-w-[435px]">
                <label htmlFor="dashboard-search" className="sr-only">Search products</label>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">⌕</span>
                <input
                  id="dashboard-search"
                  value={searchText}
                  onChange={(event) => { setSearchText(event.target.value); setShowSearchResults(true); }}
                  onFocus={() => setShowSearchResults(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && searchText.trim()) setActivePage("Inventory");
                    if (event.key === "Escape") setShowSearchResults(false);
                  }}
                  placeholder="Search products, sales..."
                  className="h-[52px] w-full rounded-2xl border border-slate-300/80 bg-white/65 pl-12 pr-4 text-sm text-slate-800 shadow-inner shadow-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
                {showSearchResults && searchText.trim() && (
                  <div className="absolute left-0 right-0 top-[58px] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    {searchResults.length ? searchResults.map((product) => (
                      <button key={product.id} type="button" onClick={() => { setActivePage("Inventory"); setShowSearchResults(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-emerald-50">
                        <span><span className="block text-sm font-semibold text-slate-900">{product.name}</span><span className="text-xs text-slate-500">{product.quantity} {product.unit} in stock</span></span>
                        <span className="text-xs font-semibold text-emerald-700">Inventory →</span>
                      </button>
                    )) : <p className="px-3 py-3 text-sm text-slate-500">No matching product found. Press Enter to open Inventory.</p>}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button type="button" onClick={() => setActivePage(lowStockCount > 0 ? "Inventory" : "AI Assistant")} aria-label="Notifications and alerts" title={lowStockCount > 0 ? "View low stock alerts" : "No stock alerts"} className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full border border-slate-200 bg-white/80 text-2xl text-slate-800 shadow-sm transition hover:bg-emerald-50">♧
                  {lowStockCount > 0 && <span className="absolute right-1 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{lowStockCount}</span>}
                </button>
                <div className="relative">
                  <button type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} className="flex h-[52px] items-center gap-3 rounded-full bg-white/70 py-1 pl-1 pr-3 shadow-sm transition hover:bg-white">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 text-2xl font-bold text-white shadow-md">Z</span>
                    <span className="hidden text-slate-700 sm:inline">⌄</span>
                  </button>
                 {profileOpen && (
  <div className="absolute right-0 top-[60px] z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
    <div className="border-b border-slate-100 px-3 py-2">
      <p className="text-xs font-semibold text-slate-500">SIGNED IN AS</p>
      <p className="mt-1 truncate text-sm font-medium text-slate-900">
        {user.email ?? "Your account"}
      </p>
    </div>

    <button
      type="button"
      onClick={() => {
        setActivePage("Backup & Restore");
        setProfileOpen(false);
      }}
      className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-emerald-50"
    >
      Backup & Restore
    </button>

    <button
      type="button"
      onClick={() => {
        setActivePage("AI Assistant");
        setProfileOpen(false);
      }}
      className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-emerald-50"
    >
      AI Assistant
    </button>

    <button
      type="button"
      onClick={async () => {
        try {
          await signOut(auth);
          router.replace("/login");
        } catch (error) {
          console.error("Sign out failed:", error);
        }
      }}
      className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
    >
      Sign Out
    </button>
  </div>
)}
                </div>
              </div>
            </div>
          </header>

          <div className="border-b border-white/70 bg-white/60 px-3 py-3 md:hidden">
            <nav className="flex gap-2 overflow-x-auto">
              {navigation.map((item) => <button key={item.name} type="button" onClick={() => setActivePage(item.name)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold ${activePage === item.name ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}><span>{item.icon}</span>{item.name}</button>)}
            </nav>
          </div>

          <div className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 lg:p-8" onClick={() => { if (showSearchResults) setShowSearchResults(false); }}>
            {activePage === "Dashboard" ? renderDashboard() : (
              <div className="rounded-[24px] border border-white bg-white/90 p-4 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-emerald-700">ZevaSewa Workspace</p><h2 className="mt-1 text-2xl font-extrabold text-slate-950">{activePage}</h2></div>
                  <button type="button" onClick={() => setActivePage("Dashboard")} className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">← Dashboard</button>
                </div>
                {activePage === "Inventory" && <Inventory />}
                {activePage === "Sales" && <Sales />}
                {activePage === "Purchase Planner" && <PurchasePlanner />}
                {activePage === "Cash Flow" && <CashFlow />}
                {activePage === "Backup & Restore" && <BackupRestore />}
                {activePage === "AI Assistant" && <AIAssistant />}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
