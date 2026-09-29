'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { ArrowRight, Check, Clock3, PackageCheck, RotateCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { RootState, AppDispatch } from '@/store';
import { openAuthModal } from '@/store/slices/authSlice';
import { orderService } from '@/services/api/orderService';
import { getProductImage } from '@/utils/pathResolution';
import { loadRazorpay, type RazorpaySuccess, type RazorpayFailure, type RazorpayOptions } from '@/utils/razorpay';
import type { CreateOrderResponse, UserOrder, UserOrderPage } from '@/types/order';
import { PaginationNav } from '@/components/common/PaginationNav';

const money = (amount: number, currency: string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
const formatStatus = (status: string) => status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const statusClass = (status: string) => status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : ['CANCELLED', 'RTO'].includes(status) ? 'bg-stone-100 text-stone-600 ring-stone-200' : status === 'PENDING_PAYMENT' ? 'bg-amber-50 text-amber-900 ring-amber-200' : 'bg-blue-50 text-blue-800 ring-blue-200';

export default function OrdersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const authenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);

  const refreshOrders = useCallback(async (targetPage = page) => {
    const data: unknown = await orderService.getOrders({ page: targetPage, pageSize: 10 });
    if (Array.isArray(data)) {
      setOrders(data);
      setTotal(data.length);
      setTotalPages(1);
    } else if (data && typeof data === 'object' && 'orders' in data) {
      const pageData = data as UserOrderPage;
      setOrders(pageData.orders || []);
      setTotal(pageData.total ?? (pageData.orders?.length || 0));
      setTotalPages(pageData.totalPages ?? 1);
    } else {
      setOrders([]);
      setTotal(0);
      setTotalPages(0);
    }
    setError('');
  }, [page]);

  useEffect(() => {
    if (!authenticated) { setLoading(false); return; }
    setLoading(true);
    refreshOrders(page).catch((err) => setError(err instanceof Error ? err.message : 'Could not load orders.')).finally(() => setLoading(false));
  }, [authenticated, page, refreshOrders]);

  const retryPayment = async (orderId: number) => {
    setBusyOrderId(orderId);
    try {
      const order: CreateOrderResponse = await orderService.retryPayment(orderId);
      if (!await loadRazorpay() || !window.Razorpay || !order.razorpayKeyId || !order.razorpayOrderId) throw new Error('Razorpay Checkout is unavailable. Please try again.');
      const options: RazorpayOptions = {
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Vedic Puja Sanskar',
        description: `Complete payment for order #${order.orderId}`,
        order_id: order.razorpayOrderId,
        prefill: { name: '', contact: '' },
        theme: { color: '#92400e' },
        handler: (payment: RazorpaySuccess) => {
          void orderService.verifyPayment(order.orderId, { razorpayOrderId: payment.razorpay_order_id, razorpayPaymentId: payment.razorpay_payment_id, razorpaySignature: payment.razorpay_signature })
            .then(async () => { await refreshOrders(page); })
            .catch((err) => toast.error(err instanceof Error ? err.message : 'Payment confirmation is pending.'))
            .finally(() => setBusyOrderId(null));
        },
        modal: { ondismiss: () => setBusyOrderId(null) },
      };
      const checkout = new window.Razorpay(options);
      checkout.on('payment.failed', (response: RazorpayFailure) => toast.error(response.error?.description || 'Payment failed. You can try again.'));
      checkout.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start payment.');
      setBusyOrderId(null);
    }
  };

  const cancelOrder = async (orderId: number) => {
    if (!window.confirm(`Cancel order #${orderId}? This will cancel every item in the order.`)) return;
    setBusyOrderId(orderId);
    try { await orderService.cancelOrder(orderId); await refreshOrders(page); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Could not cancel this order.'); }
    finally { setBusyOrderId(null); }
  };

  const requestReturn = async (orderId: number) => {
    setBusyOrderId(orderId);
    try { await orderService.requestReturn(orderId); await refreshOrders(page); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Could not submit the return request.'); }
    finally { setBusyOrderId(null); }
  };

  const safeOrders = orders || [];

  return <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">Your account</p><h1 className="mt-2 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">Your orders</h1><p className="mt-2 text-stone-600">Order details and delivery updates, all in one place.</p></div>
      {authenticated && !loading && total > 0 && <span className="rounded-full bg-[#fdfbf7] px-4 py-2 text-sm font-semibold text-stone-700 ring-1 ring-amber-900/10">{total} orders placed</span>}
    </div>

    {!authenticated ? <div className="rounded-3xl border border-stone-200 bg-[#fdfbf7] p-8 text-center sm:p-12">
      <p className="font-serif text-2xl text-stone-900">Sign in to view your orders</p>
      <p className="mt-2 text-stone-600">Track delivery status, view items, and manage returns.</p>
      <button onClick={() => dispatch(openAuthModal('login'))} className="mt-6 rounded-full bg-amber-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-900">Sign in to account</button>
    </div> : loading ? <div className="grid gap-4">{[1, 2].map((id) => <div key={id} className="h-44 animate-pulse rounded-2xl bg-stone-100" />)}</div> : error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><p className="text-red-800">{error}</p><button onClick={() => void refreshOrders(page)} className="mt-3 rounded-full border border-red-300 bg-white px-4 py-1.5 text-sm font-semibold text-red-800">Try again</button></div> : safeOrders.length === 0 ? <div className="rounded-3xl border border-dashed border-stone-200 bg-[#fdfbf7] p-10 text-center sm:p-14">
      <PackageCheck className="mx-auto text-amber-800/60" size={40} />
      <h2 className="mt-4 font-serif text-2xl text-stone-900">No orders placed yet</h2>
      <p className="mt-2 text-stone-600">Items you purchase will appear here with delivery details.</p>
      <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-900">Explore collection <ArrowRight size={16} /></Link>
    </div> : <div className="grid gap-6">{safeOrders.map((order) => {
      const isBusy = busyOrderId === order.orderId;
      const canRetryPayment = order.status === 'PENDING_PAYMENT' && order.paymentMethod === 'razorpay';
      const canCancel = ['PENDING_PAYMENT', 'PLACED'].includes(order.status) && (order.paymentStatus === 'pending' || order.status === 'PENDING_PAYMENT');
      const canReturn = order.status === 'DELIVERED' && !order.returnStatus;

      return <article key={order.orderId} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
        <header className="grid gap-4 border-b border-stone-200 bg-stone-50 px-5 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-center">
          <div><p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Order placed</p><p className="mt-1 font-medium text-stone-900">{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p></div>
          <div><p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Order total</p><p className="mt-1 font-semibold text-stone-900">{money(order.totalAmount, order.currency)}</p></div>
          <div><p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Payment</p><p className="mt-1 capitalize text-stone-700">{order.paymentMethod} · {order.paymentStatus}</p></div>
          <div className="text-left lg:text-right"><p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Order #</p><p className="mt-1 font-mono text-sm text-stone-700">{order.orderId}</p></div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-1 pt-5 sm:px-6">
          <h2 className="text-lg font-semibold text-stone-900">{order.status === 'DELIVERED' ? 'Delivered' : order.status === 'PENDING_PAYMENT' ? 'Payment required' : order.status === 'CANCELLED' ? 'Order cancelled' : `Order ${formatStatus(order.status).toLowerCase()}`}</h2>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusClass(order.status)}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{formatStatus(order.status)}</span>
        </div>
        {order.returnStatus && <p className="mx-5 mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 sm:mx-6">Return requested · We’ll share an update when it’s reviewed.</p>}
        {canRetryPayment && <div className="mx-5 mt-4 flex flex-col justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:mx-6 sm:flex-row sm:items-center"><div><p className="font-semibold text-amber-950">Your order is waiting for payment</p><p className="mt-0.5 text-sm text-amber-900/80">Complete payment to confirm this order.</p></div><button disabled={isBusy} onClick={() => void retryPayment(order.orderId)} className="shrink-0 rounded-full bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:opacity-60">{isBusy ? 'Opening checkout…' : 'Complete payment'}</button></div>}

        <div className="divide-y divide-stone-100 px-5 sm:px-6">
          {order.items.map((item, index) => <div key={`${item.productName}-${index}`} className="flex items-center gap-4 py-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-[#f5f0e7] sm:h-24 sm:w-24"><img src={getProductImage(item.imageURL || '')} alt={item.productName} className="h-full w-full object-contain p-1.5"/></div>
            <div className="min-w-0 flex-1"><h3 className="line-clamp-2 font-medium text-stone-900">{item.productName}</h3><p className="mt-1 text-sm text-stone-500">Qty {item.quantity} <span className="px-1">·</span> {money(item.amount, order.currency)} each</p><p className="mt-2 text-sm font-semibold text-stone-800">{money(item.amount * item.quantity, order.currency)}</p></div>
            {order.status === 'DELIVERED' && <span className="hidden items-center gap-1 text-xs font-medium text-emerald-700 sm:inline-flex"><Check size={14}/> Delivered</span>}
          </div>)}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-white px-5 py-4 sm:px-6">
          <span className="inline-flex items-center gap-1.5 text-xs text-stone-500"><PackageCheck size={15}/> Thank you for shopping with us</span>
          <div className="flex flex-wrap gap-2">
            {canCancel && <button disabled={isBusy} onClick={() => void cancelOrder(order.orderId)} className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><X size={15}/> Cancel order</button>}
            {canReturn && <button disabled={isBusy} onClick={() => void requestReturn(order.orderId)} className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-700 hover:bg-amber-50 hover:text-amber-900 disabled:opacity-50"><RotateCcw size={15}/> Request return</button>}
            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && <span className="inline-flex items-center gap-1.5 px-2 text-xs text-stone-500"><Clock3 size={14}/> Status updates as your order moves</span>}
          </div>
        </footer>
      </article>;
    })}</div>}

    {!error && totalPages > 1 && (
      <div className="mt-8">
        <PaginationNav
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={10}
          onPageChange={(newPage) => {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          isLoading={loading}
          itemLabel="orders"
        />
      </div>
    )}
  </main>;
}
