"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  ClipboardList,
  MessageSquareText,
  PackageCheck,
  Users,
} from "lucide-react";
import { adminService } from "@/services/api/adminService";
import type { AdminOrder, AdminReport } from "@/types/admin";
import { AdminDonutChart } from "@/components/admin/AdminDonutChart";

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
const cardLinks = [
  {
    title: "Customers",
    detail: "View registered accounts",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Orders",
    detail: "Review recent purchases",
    href: "/admin/orders",
    icon: PackageCheck,
  },
  {
    title: "Reports",
    detail: "Sales and order trends",
    href: "/admin/reports",
    icon: ClipboardList,
  },
  {
    title: "Feedback",
    detail: "Customer feedback inbox",
    href: "/admin/feedbacks",
    icon: MessageSquareText,
  },
];

export default function AdminDashboardPage() {
  const [report, setReport] = useState<AdminReport | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([adminService.getReports(), adminService.getOrders()])
      .then(([stats, recentOrders]) => {
        setReport(stats);
        setOrders(recentOrders.slice(0, 5));
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Could not load dashboard data.",
        ),
      );
  }, []);

  const stats = report
    ? [
        {
          label: "Customers",
          value: report.customers.toLocaleString("en-IN"),
          note: "Registered accounts",
          icon: Users,
          color: "text-violet-700 bg-violet-50",
        },
        {
          label: "Products",
          value: report.products.toLocaleString("en-IN"),
          note: "In your catalog",
          icon: Boxes,
          color: "text-amber-800 bg-amber-50",
        },
      ]
    : [];

  return (
    <section>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          Dashboard overview
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          A quick look at your store activity.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {report ? (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <AdminDonutChart
              title="Paid revenue"
              total={report.revenue}
              totalDisplay={formatMoney(report.revenue)}
              totalCaption="paid total"
              segments={[
                {
                  label: "COD collected",
                  value: report.codRevenue,
                  color: "#15803d",
                  displayValue: formatMoney(report.codRevenue),
                },
                {
                  label: "Online",
                  value: report.razorpayRevenue,
                  color: "#b45309",
                  displayValue: formatMoney(report.razorpayRevenue),
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
            {stats.map(({ label, value, note, icon: Icon, color }) => (
              <article
                key={label}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-500">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-stone-900">
                      {value}
                    </p>
                  </div>
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}
                  >
                    <Icon size={19} />
                  </span>
                </div>
                <p className="mt-3 text-xs text-stone-500">{note}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-amber-950">
                COD cash to collect
              </p>
              <p className="mt-1 text-xs text-amber-900/75">
                {report.codReceivableOrders} orders with payment still pending
              </p>
            </div>
            <p className="text-2xl font-semibold text-amber-950">
              {formatMoney(report.codReceivable)}
            </p>
          </div>
        </>
      ) : (
        <div className="h-32 animate-pulse rounded-2xl bg-stone-200/70" />
      )}

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-stone-900">Recent orders</h2>
              <p className="mt-1 text-sm text-stone-500">
                Latest activity from your customers.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-sm font-semibold text-amber-800 hover:text-amber-950"
            >
              All orders <ArrowUpRight size={16} />
            </Link>
          </div>
          {orders.length ? (
            <div className="divide-y divide-stone-100">
              {orders.map((order) => (
                <div
                  key={order.orderId}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-stone-800">
                      Order #{order.orderId}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {order.customerEmail}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-stone-800">
                      {formatMoney(order.totalAmount)}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {order.status.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-stone-500">
              {report ? "No orders yet." : "Loading orders…"}
            </p>
          )}
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-stone-900">Workspace</h2>
          <p className="mt-1 text-sm text-stone-500">Jump to a section.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {cardLinks.map(({ title, detail, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="group flex items-center gap-3 rounded-xl border border-stone-200 p-3 transition hover:border-amber-300 hover:bg-amber-50/50"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-stone-100 text-stone-600 group-hover:bg-white group-hover:text-amber-800">
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-stone-800">
                    {title}
                  </span>
                  <span className="block truncate text-xs text-stone-500">
                    {detail}
                  </span>
                </span>
                <ArrowUpRight size={16} className="text-stone-400" />
              </Link>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            <ClipboardList size={15} /> {report?.deliveredOrders ?? 0} orders
            delivered
          </div>
        </section>
      </div>
    </section>
  );
}
