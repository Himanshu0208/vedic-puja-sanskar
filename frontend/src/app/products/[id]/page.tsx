'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, Heart, Minus, PackageCheck, Plus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { productService } from '@/services/api/productService';
import type { ProductResponse } from '@/types/product';
import { getProductImage } from '@/utils/pathResolution';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { orderService } from '@/services/api/orderService';
import { authService } from '@/services/api/authService';
import type { SavedAddress } from '@/types/order';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store';
import { openAuthModal } from '@/store/slices/authSlice';
import { decreaseQuantity, increaseQuantity } from '@/store/slices/orderSlice';

const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
const actionError = (error: unknown) => typeof error === 'string' ? error : error instanceof Error ? error.message : 'Please try again.';

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { isAuthenticated } = useAuth();
  const { selectedProductQuantities } = useCart();
  const dispatch = useDispatch<AppDispatch>();
  const cartQuantity = product ? selectedProductQuantities?.get(product.id) ?? 0 : 0;
  const discounted = !!product?.offerPrice && product.offerPrice > 0 && product.offerPrice < product.sellingPrice;
  const salePrice = product ? (discounted ? product.offerPrice : product.sellingPrice) : 0;
  const isOutOfStock = product?.inStock === false || (product?.inStock === undefined && product?.quantity !== undefined && product.quantity <= 0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    if (!/^\d+$/.test(id) || Number(id) < 1) {
      setError('That product could not be found.');
      setLoading(false);
      return () => { active = false; };
    }
    productService.getProductById(id)
      .then((item) => { if (active) setProduct(item); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load this product.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      return;
    }
    setAddressesLoading(true);
    void orderService.getAddresses().then((addresses) => {
      setSavedAddresses(addresses);
      setSelectedAddressId(addresses[0]?.id ?? null);
    }).catch((reason) => toast.error(actionError(reason))).finally(() => setAddressesLoading(false));
  }, [isAuthenticated]);

  const changeCart = async (direction: 'add' | 'remove') => {
    if (!product) return;
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }
    setUpdating(true);
    try {
      await dispatch(direction === 'add' ? increaseQuantity(product.id) : decreaseQuantity(product.id)).unwrap();
    } catch (reason) {
      toast.error(actionError(reason));
    } finally {
      setUpdating(false);
    }
  };

  const benefits = product?.benefits.split(/[\n,]+/).map((benefit) => benefit.trim()).filter(Boolean) ?? [];

  useEffect(() => {
    if (!product || !isAuthenticated) { setWishlisted(false); return; }
    void authService.getWishlist().then((ids) => setWishlisted(ids.includes(product.id))).catch((reason) => toast.error(actionError(reason)));
  }, [product, isAuthenticated]);

  const toggleWishlist = async () => {
    if (!product) return;
    if (!isAuthenticated) { dispatch(openAuthModal('login')); return; }
    try {
      if (wishlisted) await authService.removeWishlist(product.id);
      else await authService.addWishlist(product.id);
      setWishlisted(!wishlisted);
    } catch (reason) { toast.error(actionError(reason)); }
  };

  const buyNow = () => {
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }
    const addressChoice = selectedAddressId ? `&addressId=${selectedAddressId}` : '&newAddress=1';
    router.push(`/cart?buyNow=${product?.id}${addressChoice}`);
  };

  if (loading) return <main className="min-h-[70vh] bg-[#fbf8f1] px-5 py-10 sm:py-16"><div className="mx-auto max-w-7xl animate-pulse"><div className="h-4 w-40 rounded bg-amber-100"/><div className="mt-8 grid gap-10 lg:grid-cols-2"><div className="aspect-square rounded-3xl bg-amber-100"/><div className="space-y-5 py-4"><div className="h-5 w-32 rounded bg-amber-100"/><div className="h-10 w-3/4 rounded bg-amber-100"/><div className="h-6 w-40 rounded bg-amber-100"/><div className="h-24 rounded-2xl bg-amber-100"/></div></div></div></main>;

  if (!product || error) return <main className="grid min-h-[65vh] place-items-center bg-[#fbf8f1] px-5 py-12"><div className="max-w-md rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-sm"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-800"><PackageCheck size={22}/></span><h1 className="mt-4 text-xl font-semibold text-stone-900">Product unavailable</h1><p className="mt-2 text-sm leading-6 text-stone-500">{error || 'This product may have been removed from the collection.'}</p><Link href="/#shop" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-900"><ArrowLeft size={16}/> Back to the collection</Link></div></main>;

  return <main className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_#f7e9ca_0,_transparent_35%),linear-gradient(180deg,#fcfaf5_0%,#f7f3ea_100%)] px-5 pb-16 pt-7 sm:pb-24 sm:pt-10">
    <div className="mx-auto max-w-7xl">
      <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-xs text-stone-500 sm:mb-10"><Link href="/" className="transition hover:text-amber-900">Home</Link><ChevronRight size={14}/><Link href="/#shop" className="transition hover:text-amber-900">Collection</Link><ChevronRight size={14}/><span className="max-w-48 truncate font-medium text-stone-700">{product.name}</span></nav>

      <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
        <div className="relative overflow-hidden rounded-[2rem] border border-white bg-gradient-to-br from-amber-100 via-orange-50 to-[#f0e7d5] p-3 shadow-[0_24px_70px_-40px_rgba(120,75,22,.45)] sm:p-5"><div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/50 blur-3xl"/><div className="absolute bottom-7 left-7 z-10 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.12em] text-stone-600 shadow-sm backdrop-blur">Vedic Puja Sanskar</div><img src={getProductImage(product.image_url)} alt={product.name} className="relative aspect-square w-full rounded-[1.4rem] object-cover shadow-md"/></div>

        <section className="py-1 sm:py-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100/70 px-3 py-1.5 text-xs font-semibold text-amber-900"><Sparkles size={13}/>{product.category.name}</span>
          <h1 className="mt-4 font-serif text-3xl leading-tight tracking-tight text-stone-950 sm:text-4xl lg:text-5xl">{product.name}</h1>
          <p className="mt-3 text-xs font-medium uppercase tracking-[.14em] text-stone-400">A thoughtful addition to your daily rituals</p>

          <div className="mt-6 rounded-3xl border border-amber-100/80 bg-white/85 p-5 shadow-[0_16px_48px_-38px_rgba(80,50,20,.55)] backdrop-blur sm:p-6">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
              <span className="text-3xl font-semibold tracking-tight text-stone-950">{money(salePrice ?? product.sellingPrice)}</span>
              {discounted && <><span className="pb-1 text-base text-stone-400 line-through">{money(product.sellingPrice)}</span><span className="mb-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">Save {Math.round(((product.sellingPrice - (salePrice ?? product.sellingPrice)) / product.sellingPrice) * 100)}%</span></>}
            </div>
            <p className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium ${isOutOfStock ? 'text-red-700' : 'text-emerald-800'}`}><span className={`h-2 w-2 rounded-full ${isOutOfStock ? 'bg-red-600' : 'bg-emerald-600'}`}/>{isOutOfStock ? 'Currently out of stock' : product.quantity !== undefined && product.quantity > 0 ? `${product.quantity} in stock` : 'In stock'}</p>
            <div className="mt-5 border-t border-stone-100 pt-5">
              <h2 className="text-sm font-semibold text-stone-900">{cartQuantity > 0 ? 'In your cart' : 'Make it yours'}</h2>
              {isAuthenticated && cartQuantity > 0 ? <div className="mt-3 inline-flex items-center gap-4 rounded-full bg-amber-50 p-1 ring-1 ring-amber-100"><button type="button" disabled={updating} onClick={() => void changeCart('remove')} aria-label={`Remove one ${product.name} from cart`} className="grid h-10 w-10 place-items-center rounded-full bg-white text-stone-700 shadow-sm transition hover:text-amber-900 disabled:opacity-50"><Minus size={17}/></button><span className="min-w-6 text-center text-sm font-bold text-stone-900" aria-live="polite">{cartQuantity}</span><button type="button" disabled={updating || isOutOfStock} onClick={() => void changeCart('add')} aria-label={`Add one ${product.name} to cart`} className="grid h-10 w-10 place-items-center rounded-full bg-amber-800 text-white shadow-sm transition hover:bg-amber-900 disabled:opacity-50"><Plus size={17}/></button></div> : <button type="button" disabled={updating || isOutOfStock} onClick={() => void changeCart('add')} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50">{isOutOfStock ? 'Out of stock' : 'Add to cart'}<ArrowRight size={17}/></button>}
              {isAuthenticated && <label className="mt-5 block text-left text-xs font-semibold text-stone-700">Deliver to
                {savedAddresses.length ? (
                  <div className="relative mt-2">
                    <select
                      value={selectedAddressId ?? ''}
                      disabled={addressesLoading}
                      onChange={(event) => setSelectedAddressId(Number(event.target.value) || null)}
                      className="w-full appearance-none rounded-xl border border-stone-200 bg-white py-3 pl-3.5 pr-9 text-sm font-medium text-stone-800 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/15"
                    >
                      <option value="">Choose a new address at checkout</option>
                      {savedAddresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.fullName} — {address.line1}, {address.city}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  </div>
                ) : (
                  <p className="mt-2 rounded-xl bg-stone-50 px-3 py-3 text-sm font-normal text-stone-600">No saved addresses yet. You can add one during checkout.</p>
                )}
              </label>}
              <button type="button" disabled={isOutOfStock || addressesLoading} onClick={buyNow} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-800 bg-white px-5 text-sm font-semibold text-amber-900 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50">Buy now</button>
              <button type="button" aria-pressed={wishlisted} onClick={toggleWishlist} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-stone-600 transition hover:bg-rose-50 hover:text-rose-700"><Heart size={17} className={wishlisted ? 'fill-rose-600 text-rose-600' : ''}/>{wishlisted ? 'Added to wishlist' : 'Add to wishlist'}</button>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-[2rem] border border-white bg-white/75 p-5 shadow-[0_20px_60px_-48px_rgba(80,50,20,.6)] sm:mt-14 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-100 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-800">Explore the details</p><h2 className="mt-2 font-serif text-2xl text-stone-900 sm:text-3xl">Everything to know</h2></div><span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600">Item #{product.id}</span></div>
        <div className="grid gap-8 pt-6 md:grid-cols-[.9fr_1.1fr] md:gap-12">
          <div><div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-stone-800"><Sparkles size={16} className="text-amber-700"/>About this item</div><p className="whitespace-pre-line text-sm leading-7 text-stone-600">{product.description || 'Product details will be added soon.'}</p></div>
          <div><div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-stone-800"><Check size={16} className="text-emerald-700"/>Product benefits</div>{benefits.length ? <ul className="grid gap-3 sm:grid-cols-2">{benefits.map((benefit, index) => <li key={`${benefit}-${index}`} className="flex items-start gap-3 rounded-2xl bg-[#f8f6f0] p-3.5 text-sm leading-6 text-stone-600"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800"><Check size={12}/></span>{benefit}</li>)}</ul> : <p className="text-sm leading-6 text-stone-500">There are no additional benefits listed for this item yet.</p>}</div>
        </div>
      </section>
    </div>
  </main>;
}
