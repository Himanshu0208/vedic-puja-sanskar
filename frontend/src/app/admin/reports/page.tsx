"use client";

import { useEffect, useState } from "react";
import {
  ChartNoAxesColumnIncreasing,
  Info,
  PackageCheck,
  Wallet,
} from "lucide-react";
import { adminService } from "@/services/api/adminService";
import type { AdminReport } from "@/types/admin";
import { AdminDonutChart } from "@/components/admin/AdminDonutChart";

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
const orderStatusDisplay: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "Awaiting payment", color: "#d97706" },
  PLACED: { label: "Placed", color: "#2563eb" },
  PROCESSING: { label: "Processing", color: "#7c3aed" },
  PACKED: { label: "Packed", color: "#9333ea" },
  SHIPPED: { label: "Shipped", color: "#0891b2" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", color: "#0284c7" },
  DELIVERED: { label: "Delivered", color: "#15803d" },
  RETURN_IN_PROGRESS: { label: "Return in progress", color: "#ea580c" },
  RETURNED: { label: "Returned", color: "#0f766e" },
  CANCELLED: { label: "Cancelled", color: "#78716c" },
};

export default function AdminReportsPage() {
  const [report, setReport] = useState<AdminReport | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    adminService
      .getReports()
      .then(setReport)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Could not load reports.",
        ),
      );
  }, []);
  const maxRevenue = Math.max(
    1,
    ...(report?.monthlyRevenue.map((item) => item.revenue) ?? []),
  );

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            Reports
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Sales and fulfilment overview for your store.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-medium text-stone-600 ring-1 ring-stone-200">
          <ChartNoAxesColumnIncreasing size={15} /> Last 6 months
        </span>
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      ) : !report ? (
        <div className="h-44 animate-pulse rounded-2xl bg-stone-200/70" />
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <AdminDonutChart
              title="Paid revenue"
              total={report.revenue}
              totalDisplay={money(report.revenue)}
              totalCaption="paid total"
              segments={[
                {
                  label: "COD collected",
                  value: report.codRevenue,
                  color: "#15803d",
                  displayValue: money(report.codRevenue),
                },
                {
                  label: "Razorpay",
                  value: report.razorpayRevenue,
                  color: "#b45309",
                  displayValue: money(report.razorpayRevenue),
                },
              ]}
            />
            <AdminDonutChart
              title="Orders by payment method"
              total={report.codOrders + report.razorpayOrders}
              totalDisplay={report.orders.toLocaleString("en-IN")}
              totalCaption="all orders"
              shareCaption="of orders with a payment method"
              segments={[
                {
                  label: "COD",
                  value: report.codOrders,
                  color: "#b45309",
                  displayValue: `${report.codOrders}`,
                },
                {
                  label: "Online",
                  value: report.razorpayOrders,
                  color: "#2563eb",
                  displayValue: `${report.razorpayOrders}`,
                },
              ]}
            />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-4">
              <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
                  <Wallet size={17} /> COD to collect
                </div>
                <p className="mt-3 text-2xl font-semibold text-amber-950">
                  {money(report.codReceivable)}
                </p>
                <p className="mt-1 text-xs text-amber-900/75">
                  {report.codReceivableOrders} orders still unpaid
                </p>
              </article>
              <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
                  <PackageCheck size={17} className="text-amber-900" /> Order
                  status totals
                </div>
                <p className="mt-3 text-stone-700">
                  {report.deliveredOrders} delivered{" "}
                  <span className="px-1 text-stone-300">·</span>{" "}
                  {report.pendingOrders} awaiting payment
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {money(
                    report.paidOrders ? report.revenue / report.paidOrders : 0,
                  )}{" "}
                  average paid order
                </p>
              </article>
            </div>

            <AdminDonutChart
              title="Orders by status"
              total={report.orders}
              totalDisplay={report.orders.toLocaleString("en-IN")}
              totalCaption="all orders"
              segments={report.orderStatuses.map(({ status, count }) => ({
                label:
                  orderStatusDisplay[status]?.label ??
                  status.replaceAll("_", " "),
                value: count,
                color: orderStatusDisplay[status]?.color ?? "#a8a29e",
                displayValue: `${count}`,
              }))}
            />
          </div>
          <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <h2 className="font-semibold text-stone-900">
                Monthly paid revenue
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Revenue from successful captured payments.
              </p>
            </div>
            <div className="grid h-64 grid-cols-6 items-end gap-3 border-b border-stone-200 pb-2 sm:gap-5">
              {report.monthlyRevenue.map((item) => (
                <div
                  key={item.month}
                  className="flex h-full flex-col items-center justify-end gap-2"
                >
                  <span className="max-w-full truncate text-[10px] text-stone-500 sm:text-xs">
                    {item.revenue ? money(item.revenue) : ""}
                  </span>
                  <div
                    title={`${item.month}: ${money(item.revenue)}`}
                    className="w-full max-w-16 rounded-t-lg bg-amber-700 transition-all hover:bg-amber-800"
                    style={{
                      height: `${Math.max(5, (item.revenue / maxRevenue) * 68)}%`,
                    }}
                  />
                  <span className="text-[10px] text-stone-500 sm:text-xs">
                    {new Date(`${item.month}-01T00:00:00`).toLocaleDateString(
                      "en-IN",
                      { month: "short" },
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
              <span>Grouped by order creation month</span>
              <span>
                {report.products} products · {report.customers} customers
              </span>
            </div>
          </section>
          <p className="mt-4 flex items-center gap-2 text-xs text-stone-500">
            <Info size={14} /> COD receivable remains outstanding until the
            payment is marked successful. Exports are not available yet.
          </p>
        </>
      )}
    </section>
  );
}
