'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

import { RootState, AppDispatch } from '@/store';
import { clearCart, fetchCart, increaseQuantity, decreaseQuantity, removeItemFromCart } from '@/store/slices/orderSlice';
import { ProductCartCard } from '@/components/common/ProductCartCard';
import { orderService } from '@/services/api/orderService';
import type { CreateOrderResponse, SavedAddress, ShippingAddress } from '@/types/order';
import { loadRazorpay, type RazorpaySuccess, type RazorpayFailure } from '@/utils/razorpay';

const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 2,
}).format(price);

export default function CartPage() {
  const { cart, isLoading, error } = useSelector((state: RootState) => state.order);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const dispatch = useDispatch<AppDispatch>();
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<number | null>(null);
  const [pendingVerification, setPendingVerification] = useState<{ order: CreateOrderResponse; payment: RazorpaySuccess } | null>(null);
  const [shipping, setShipping] = useState<ShippingAddress>({
    fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'IN',
  });
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  useEffect(() => { dispatch(fetchCart()); }, [dispatch]);
  useEffect(() => {
    if (!isAuthenticated) return;
    void orderService.getAddresses().then((addresses) => {
      setSavedAddresses(addresses);
      if (addresses.length) {
        setSelectedAddressId(addresses[0].id);
        setShipping(addresses[0]);
      }
    }).catch((err) => toast.error(err instanceof Error ? err.message : 'Could not load saved addresses.'));
  }, [isAuthenticated]);

  const handleIncreaseQuantity = (productId: number) => dispatch(increaseQuantity(productId));
  const handleDecreaseQuantity = (productId: number) => dispatch(decreaseQuantity(productId));
  const handleRemoveItem = (productId: number) => dispatch(removeItemFromCart(productId));

  const verifyPayment = async (order: CreateOrderResponse, payment: RazorpaySuccess) => {
    setPendingVerification({ order, payment });
    try {
      await orderService.verifyPayment(order.orderId, {
        razorpayOrderId: payment.razorpay_order_id,
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature,
      });
      dispatch(clearCart());
      setPendingVerification(null);
      setCompletedOrderId(order.orderId);
      toast.success('Payment received and order placed.');
    } catch (paymentError) {
      toast.error(`Payment confirmation is pending. Retry verification before paying again. ${paymentError instanceof Error ? paymentError.message : ''}`);
    }
  };

  const handleCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingVerification) return;
    setIsCheckingOut(true);
    try {
      if (paymentMethod === 'razorpay' && !(await loadRazorpay())) {
        throw new Error('Could not load Razorpay Checkout. Please try again.');
      }
      const order = await orderService.createOrder({ paymentMethod, ...(selectedAddressId ? { shippingAddressId: selectedAddressId } : { shippingAddress: shipping }) });
      if (paymentMethod === 'cod') {
        dispatch(clearCart());
        setCompletedOrderId(order.orderId);
        toast.success('Your COD order has been placed.');
        return;
      }

      const Razorpay = window.Razorpay;
      if (!order.razorpayKeyId || !order.razorpayOrderId || !Razorpay) {
        throw new Error('Razorpay Checkout is not ready. Please try again.');
      }
      const checkout = new Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Vedic Puja Sanskar',
        description: `Order #${order.orderId}`,
        order_id: order.razorpayOrderId,
        prefill: { name: shipping.fullName, contact: shipping.phone },
        theme: { color: '#92400e' },
        handler: (payment) => { void verifyPayment(order, payment); },
        modal: { ondismiss: () => setIsCheckingOut(false) },
      });
      checkout.on('payment.failed', (response) => {
        toast.error(response.error?.description || 'Payment failed. You can try checkout again.');
      });
      checkout.open();
    } catch (checkoutError) {
      toast.error(checkoutError instanceof Error ? checkoutError.message : 'Could not start checkout.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const updateShipping = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setShipping((current) => ({ ...current, [name]: value }));
  };

  const subtotal = cart?.items.reduce((sum, item) => {
    const price = item.discountedPrice > 0 && item.discountedPrice < item.price ? item.discountedPrice : item.price;
    return sum + price * item.quantity;
  }, 0) || 0;

  if (completedOrderId !== null) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
        <h1 className="mt-5 font-serif text-3xl text-stone-900">Order placed</h1>
        <p className="mt-2 text-stone-600">Your order number is <strong>#{completedOrderId}</strong>. We’ve saved your delivery details.</p>
        <Link href="/" className="mt-7 rounded-full bg-amber-800 px-6 py-3 font-semibold text-white hover:bg-amber-900">Continue shopping</Link>
      </div>
    );
  }

  if (isLoading) return <div className="flex min-h-[50vh] items-center justify-center p-8 text-stone-600">Loading your cart…</div>;
  if (error) return <div className="flex min-h-[50vh] flex-col items-center justify-center p-8"><h1 className="mb-2 text-3xl font-bold">Could not load cart</h1><p className="text-red-600">{error}</p></div>;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <ShoppingCart className="mb-6 h-20 w-20 text-stone-300" />
        <h1 className="font-serif text-3xl text-stone-900">Your cart is empty</h1>
        <p className="mb-8 mt-2 text-stone-600">Add something meaningful to begin.</p>
        <Link href="/" className="rounded-full bg-amber-800 px-6 py-3 font-semibold text-white hover:bg-amber-900">Continue shopping</Link>
      </div>
    );
  }

  const inputClass = 'mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/15';
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <h1 className="mb-8 font-serif text-3xl text-stone-900 sm:text-4xl">Your shopping cart</h1>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {cart.items.map((item) => <ProductCartCard key={item.productId} item={item} onIncrease={handleIncreaseQuantity} onDecrease={handleDecreaseQuantity} onRemove={handleRemoveItem} />)}
        </div>
        <form onSubmit={handleCheckout} className="space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6 lg:sticky lg:top-24">
          <section>
            <h2 className="text-xl font-semibold text-stone-900">Delivery details</h2>
            {savedAddresses.length > 0 && <label className="mt-4 block text-sm font-medium text-stone-700">Saved address
              <select className={inputClass} value={selectedAddressId ?? ''} onChange={(event) => {
                const id = Number(event.target.value) || null;
                setSelectedAddressId(id);
                const address = savedAddresses.find((item) => item.id === id);
                if (address) setShipping(address);
                else setShipping({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'IN' });
              }}>
                {savedAddresses.map((address) => <option key={address.id} value={address.id}>{address.fullName} — {address.line1}, {address.city}</option>)}
                <option value="">Use a new address</option>
              </select>
            </label>}
            {!selectedAddressId && <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-stone-700">Full name<input className={inputClass} name="fullName" autoComplete="name" required maxLength={120} value={shipping.fullName} onChange={updateShipping} /></label>
              <label className="text-sm font-medium text-stone-700">Phone<input className={inputClass} name="phone" autoComplete="tel" type="tel" required minLength={8} maxLength={20} value={shipping.phone} onChange={updateShipping} /></label>
              <label className="text-sm font-medium text-stone-700 sm:col-span-2">Address line 1<input className={inputClass} name="line1" autoComplete="address-line1" required maxLength={255} value={shipping.line1} onChange={updateShipping} /></label>
              <label className="text-sm font-medium text-stone-700 sm:col-span-2">Address line 2 <span className="font-normal text-stone-400">(optional)</span><input className={inputClass} name="line2" autoComplete="address-line2" maxLength={255} value={shipping.line2} onChange={updateShipping} /></label>
              <label className="text-sm font-medium text-stone-700">City<input className={inputClass} name="city" autoComplete="address-level2" required maxLength={100} value={shipping.city} onChange={updateShipping} /></label>
              <label className="text-sm font-medium text-stone-700">State<input className={inputClass} name="state" autoComplete="address-level1" required maxLength={100} value={shipping.state} onChange={updateShipping} /></label>
              <label className="text-sm font-medium text-stone-700">Postal code<input className={inputClass} name="postalCode" autoComplete="postal-code" required maxLength={20} value={shipping.postalCode} onChange={updateShipping} /></label>
              <label className="text-sm font-medium text-stone-700">Country code<input className={inputClass} name="country" autoComplete="country" required minLength={2} maxLength={2} value={shipping.country} onChange={updateShipping} /></label>
            </div>}
          </section>

          <section className="border-t border-stone-100 pt-5">
            <h2 className="text-xl font-semibold text-stone-900">Payment</h2>
            <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3 text-sm text-stone-700 has-[:checked]:border-amber-800 has-[:checked]:bg-amber-50/60">
              <input type="radio" name="paymentMethod" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} /> Pay online with Razorpay
            </label>
            <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3 text-sm text-stone-700 has-[:checked]:border-amber-800 has-[:checked]:bg-amber-50/60">
              <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} /> Cash on delivery
            </label>
          </section>

          <div className="space-y-3 border-t border-stone-100 pt-5 text-sm">
            <div className="flex justify-between text-stone-600"><span>Items ({cart.items.length})</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between border-t border-stone-100 pt-3 text-lg font-bold text-stone-900"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
          </div>
          {pendingVerification && (
            <button type="button" onClick={() => void verifyPayment(pendingVerification.order, pendingVerification.payment)} className="w-full rounded-full bg-amber-700 px-5 py-3 font-semibold text-white hover:bg-amber-800">
              Retry payment confirmation
            </button>
          )}
          <button type="submit" disabled={isCheckingOut || !!pendingVerification} className="w-full rounded-full bg-amber-800 px-5 py-3 font-semibold text-white transition hover:bg-amber-900 disabled:cursor-wait disabled:opacity-60">
            {isCheckingOut ? 'Starting checkout…' : paymentMethod === 'cod' ? 'Place COD order' : 'Continue to payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
