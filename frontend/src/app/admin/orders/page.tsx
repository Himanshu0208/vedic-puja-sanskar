'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { adminService } from '@/services/api/adminService';
import type { AdminOrder } from '@/types/admin';

const money = (value: number, currency: string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value);
const badge = (status: string) => status === 'DELIVERED' || status === 'success' ? 'bg-emerald-50 text-emerald-700' : status === 'CANCELLED' || status === 'failed' ? 'bg-stone-100 text-stone-600' : status === 'PENDING_PAYMENT' || status === 'pending' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-700';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { adminService.getOrders().then(setOrders).catch((err) => setError(err instanceof Error ? err.message : 'Could not load orders.')).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => orders.filter((order) => (status === 'all' || order.status === status) && `${order.orderId} ${order.customerEmail}`.toLowerCase().includes(search.toLowerCase())), [orders, search, status]);
  const statuses = ['all', ...Array.from(new Set(orders.map((order) => order.status)))];

  return <section>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Orders</h1><p className="mt-1 text-sm text-stone-500">Latest 100 customer orders and payment states.</p></div><span className="rounded-full bg-white px-3.5 py-2 text-sm font-medium text-stone-600 ring-1 ring-stone-200">{orders.length} orders</span></div>
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center"><div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-2.5 text-stone-400" size={17}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order number or customer" className="w-full rounded-xl border border-stone-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-700"/></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-amber-700">{statuses.map((item) => <option key={item} value={item}>{item === 'all' ? 'All statuses' : item.replaceAll('_', ' ')}</option>)}</select><span className="text-sm text-stone-500">{filtered.length} shown</span></div>
    {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-5 py-3.5 font-semibold">Order</th><th className="px-5 py-3.5 font-semibold">Customer</th><th className="px-5 py-3.5 font-semibold">Placed</th><th className="px-5 py-3.5 font-semibold">Total</th><th className="px-5 py-3.5 font-semibold">Payment</th><th className="px-5 py-3.5 font-semibold">Fulfilment</th></tr></thead><tbody className="divide-y divide-stone-100">{loading ? <tr><td colSpan={6} className="px-5 py-12 text-center text-stone-500">Loading orders…</td></tr> : filtered.map((order) => <tr key={order.orderId} className="hover:bg-stone-50/70"><td className="px-5 py-4 font-mono font-medium text-stone-800">#{order.orderId}</td><td className="px-5 py-4 text-stone-700">{order.customerEmail}</td><td className="px-5 py-4 text-stone-600">{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td><td className="px-5 py-4 font-medium text-stone-900">{money(order.totalAmount, order.currency)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badge(order.paymentStatus)}`}>{order.paymentMethod} · {order.paymentStatus}</span></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge(order.status)}`}>{order.status.replaceAll('_', ' ')}</span></td></tr>)}{!loading && filtered.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-stone-500">No orders match these filters.</td></tr>}</tbody></table></div></div>}
  </section>;
}
