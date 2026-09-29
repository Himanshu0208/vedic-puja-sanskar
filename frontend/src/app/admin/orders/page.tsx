'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Loader2, RotateCcw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/api/adminService';
import type { AdminOrder, AdminOrderPage } from '@/types/admin';
import { PaginationNav } from '@/components/common/PaginationNav';

const money = (value: number, currency: string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value);

const paymentBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'success':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'failed':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'refunded':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'pending':
    default:
      return 'bg-amber-50 text-amber-800 border-amber-200';
  }
};

const fulfilmentBadge = (status: string) => {
  switch (status.toUpperCase()) {
    case 'DELIVERED':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case 'OUT_FOR_DELIVERY':
      return 'bg-cyan-50 text-cyan-800 border-cyan-300';
    case 'SHIPPED':
      return 'bg-blue-50 text-blue-800 border-blue-300';
    case 'PACKED':
      return 'bg-indigo-50 text-indigo-800 border-indigo-300';
    case 'PROCESSING':
      return 'bg-violet-50 text-violet-800 border-violet-300';
    case 'PLACED':
      return 'bg-sky-50 text-sky-800 border-sky-300';
    case 'CANCELLED':
      return 'bg-stone-100 text-stone-600 border-stone-300';
    case 'RTO':
      return 'bg-rose-50 text-rose-800 border-rose-300';
    case 'PENDING_PAYMENT':
    default:
      return 'bg-amber-50 text-amber-900 border-amber-300';
  }
};

const ALL_FULFILMENT_STATUSES = [
  'PENDING_PAYMENT',
  'PLACED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RTO',
];

const ALL_PAYMENT_STATUSES = [
  'pending',
  'success',
  'failed',
  'refunded',
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [search, setSearch] = useState('');
  const [fulfilmentFilter, setFulfilmentFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      adminService
        .getOrders({
          page,
          pageSize: 20,
          search,
          status: fulfilmentFilter === 'all' ? '' : fulfilmentFilter,
          paymentStatus: paymentFilter === 'all' ? '' : paymentFilter,
        })
        .then((result: unknown) => {
          if (!active) return;
          if (Array.isArray(result)) {
            setOrders(result);
            setTotal(result.length);
            setTotalPages(1);
          } else if (result && typeof result === 'object' && 'orders' in result) {
            const data = result as AdminOrderPage;
            setOrders(data.orders || []);
            setTotal(data.total ?? (data.orders?.length || 0));
            setTotalPages(data.totalPages ?? 1);
          } else {
            setOrders([]);
            setTotal(0);
            setTotalPages(0);
          }
        })
        .catch((err) => {
          if (active) setError(err instanceof Error ? err.message : 'Could not load orders.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [page, search, fulfilmentFilter, paymentFilter]);

  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    if (!nextStatus) return;
    setUpdatingOrderId(orderId);
    try {
      await adminService.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: nextStatus } : o))
      );
      toast.success(`Order #${orderId} moved to ${nextStatus.replaceAll('_', ' ')}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const safeOrders = orders || [];

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-stone-500">Search and review customer orders and payment states.</p>
        </div>
        <span className="rounded-full bg-white px-3.5 py-2 text-sm font-medium text-stone-600 ring-1 ring-stone-200">
          {total} orders
        </span>
      </div>
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 text-stone-400" size={17} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search order # or email"
              className="w-full rounded-xl border border-stone-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-700"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Fulfilment:</span>
            <div className="relative">
              <select
                value={fulfilmentFilter}
                onChange={(e) => {
                  setFulfilmentFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none rounded-xl border border-stone-200 bg-white py-2 pl-3 pr-8 text-sm text-stone-700 outline-none cursor-pointer focus:border-amber-700"
              >
                <option value="all">All Fulfilment</option>
                {ALL_FULFILMENT_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Payment:</span>
            <div className="relative">
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none rounded-xl border border-stone-200 bg-white py-2 pl-3 pr-8 text-sm capitalize text-stone-700 outline-none cursor-pointer focus:border-amber-700"
              >
                <option value="all">All Payments</option>
                {ALL_PAYMENT_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(search || fulfilmentFilter !== 'all' || paymentFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFulfilmentFilter('all');
                setPaymentFilter('all');
                setPage(1);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
            >
              <RotateCcw size={12} /> Clear
            </button>
          )}
          <span className="text-sm text-stone-500">{safeOrders.length} on this page</span>
        </div>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Order</th>
                  <th className="px-5 py-3.5 font-semibold">Customer</th>
                  <th className="px-5 py-3.5 font-semibold">Placed</th>
                  <th className="px-5 py-3.5 font-semibold">Total</th>
                  <th className="px-5 py-3.5 font-semibold">Payment</th>
                  <th className="px-5 py-3.5 font-semibold">Fulfilment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-stone-500">Loading orders…</td>
                  </tr>
                ) : (
                  safeOrders.map((order) => {
                    const isUpdating = updatingOrderId === order.orderId;
                    return (
                      <tr key={order.orderId} className="hover:bg-stone-50/70">
                        <td className="px-5 py-4 font-mono font-medium text-stone-800">#{order.orderId}</td>
                        <td className="px-5 py-4 text-stone-700">{order.customerEmail}</td>
                        <td className="px-5 py-4 text-stone-600">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </td>
                        <td className="px-5 py-4 font-medium text-stone-900">{money(order.totalAmount, order.currency)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${paymentBadge(order.paymentStatus)}`}>
                            {order.paymentMethod} · {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <select
                                value={order.status}
                                disabled={isUpdating}
                                onChange={(e) => void handleStatusChange(order.orderId, e.target.value)}
                                className={`appearance-none rounded-xl border py-1.5 pl-3 pr-7 text-xs font-semibold transition outline-none cursor-pointer hover:opacity-90 disabled:opacity-50 ${fulfilmentBadge(order.status)}`}
                              >
                                {ALL_FULFILMENT_STATUSES.map((st) => (
                                  <option key={st} value={st} className="bg-white text-stone-800 font-normal">
                                    {st.replaceAll('_', ' ')}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-70" />
                            </div>
                            {isUpdating && (
                              <Loader2 size={15} className="animate-spin text-amber-800" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                {!loading && safeOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-stone-500">No orders match these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!error && totalPages > 1 && (
        <div className="mt-4">
          <PaginationNav
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={20}
            onPageChange={(newPage) => {
              setPage(newPage);
            }}
            isLoading={loading}
            itemLabel="orders"
          />
        </div>
      )}
    </section>
  );
}
