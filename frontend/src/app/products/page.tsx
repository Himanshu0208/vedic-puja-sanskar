'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  Flame,
  Heart,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { AppDispatch, RootState } from '@/store';
import { getAllCategories } from '@/store/slices/categorySlice';
import { getAllProducts } from '@/store/slices/productSlice';
import { fetchCart, decreaseQuantity, increaseQuantity } from '@/store/slices/orderSlice';
import { openAuthModal } from '@/store/slices/authSlice';
import { authService } from '@/services/api/authService';
import { getProductImage } from '@/utils/pathResolution';
import { PaginationNav } from '@/components/common/PaginationNav';
import type { ProductResponse } from '@/types/product';

const money = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const effectivePrice = (p: ProductResponse) =>
  (p.offerPrice ?? 0) > 0 && (p.offerPrice ?? 0) < p.sellingPrice
    ? (p.offerPrice as number)
    : p.sellingPrice;

const discountPercent = (p: ProductResponse) =>
  p.sellingPrice > 0 && (p.offerPrice ?? 0) > 0 && (p.offerPrice ?? 0) < p.sellingPrice
    ? Math.round(((p.sellingPrice - (p.offerPrice as number)) / p.sellingPrice) * 100)
    : 0;

export default function ProductsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'discount'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState<number | null>(null);

  const { products, total, totalPages, isLoading } = useSelector(
    (state: RootState) => state.product
  );
  const { category: categoryData } = useSelector((state: RootState) => state.category);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const cart = useSelector((state: RootState) => state.order.cart);

  // Map of product ID to quantity in user's cart
  const cartQuantities = useMemo(() => {
    const map = new Map<number, number>();
    if (cart?.items) {
      for (const item of cart.items) {
        map.set(item.productId, item.quantity);
      }
    }
    return map;
  }, [cart]);

  // Categories list
  const categories = useMemo(() => {
    return categoryData?.categories ? categoryData.categories.map((c) => c.name) : [];
  }, [categoryData]);

  // Fetch categories on mount
  useEffect(() => {
    dispatch(getAllCategories());
  }, [dispatch]);

  // Fetch cart & wishlist on mount/auth
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
      authService
        .getWishlist()
        .then((ids) => setWishlist(ids))
        .catch(() => setWishlist([]));
    } else {
      setWishlist([]);
    }
  }, [dispatch, isAuthenticated]);

  // Fetch products with 250ms debounce
  useEffect(() => {
    const timer = window.setTimeout(() => {
      dispatch(
        getAllProducts({
          page,
          pageSize: 12,
          search: searchTerm.trim(),
          category: selectedCategory === 'All' ? '' : selectedCategory,
        })
      );
    }, 250);
    return () => window.clearTimeout(timer);
  }, [dispatch, page, searchTerm, selectedCategory]);

  // Handle sorting & stock filtering on current page items
  const displayedProducts = useMemo(() => {
    let list = [...(products || [])];

    if (inStockOnly) {
      list = list.filter((p) => p.inStock === true || (p.inStock === undefined && (p.quantity ?? 0) > 0));
    }

    switch (sortBy) {
      case 'price_asc':
        list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
        break;
      case 'price_desc':
        list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
        break;
      case 'discount':
        list.sort((a, b) => discountPercent(b) - discountPercent(a));
        break;
      case 'featured':
      default:
        break;
    }

    return list;
  }, [products, inStockOnly, sortBy]);

  // Handle Wishlist Toggle
  const handleToggleWishlist = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }

    const isWished = wishlist.includes(productId);
    setWishlistLoading(productId);
    try {
      if (isWished) {
        await authService.removeWishlist(productId);
        setWishlist((prev) => prev.filter((id) => id !== productId));
        toast.success('Removed from wishlist');
      } else {
        await authService.addWishlist(productId);
        setWishlist((prev) => [...prev, productId]);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Could not update wishlist.');
    } finally {
      setWishlistLoading(null);
    }
  };

  // Add / Modify cart
  const handleAddToCart = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }
    dispatch(increaseQuantity(productId));
    toast.success('Item added to cart');
  };

  const handleDecreaseQuantity = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(decreaseQuantity(productId));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSortBy('featured');
    setInStockOnly(false);
    setPage(1);
  };

  return (
    <main className="min-h-screen bg-[#fcf9f2] text-stone-900 pb-20">
      {/* Hero / Header Banner */}
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#f5ede0] via-[#faf4ea] to-[#fcf9f2] px-4 pt-12 pb-14 sm:px-6 sm:pt-16 sm:pb-18 lg:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-1/4 -z-10 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-10 -left-20 -z-10 h-72 w-72 rounded-full bg-orange-200/30 blur-2xl"
        />

        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-900/10 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800 shadow-2xs backdrop-blur-xs">
              <Sparkles size={14} className="text-amber-600" />
              Sacred Essentials Collection
            </div>

            <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
              Explore the <span className="italic text-amber-800">Sacred Collection</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base sm:leading-7">
              Imbued with devotion and Vedic authenticity. Discover certified Rudraksha, sacred malas,
              energized yantras, and sanctified puja items for your daily spiritual practice.
            </p>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <div id="catalog-view" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Unified Filter Controls Toolbar */}
        <div className="my-6 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 text-stone-400" size={17} />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search products..."
                className="w-full rounded-xl border border-stone-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-700"
              />
            </div>

            {/* Category Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Category:</span>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="appearance-none rounded-xl border border-stone-200 bg-white py-2 pl-3 pr-8 text-sm text-stone-700 outline-none cursor-pointer focus:border-amber-700"
                >
                  <option value="All">All Categories</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Sort:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="appearance-none rounded-xl border border-stone-200 bg-white py-2 pl-3 pr-8 text-sm text-stone-700 outline-none cursor-pointer focus:border-amber-700"
                >
                  <option value="featured">Featured & Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="discount">Highest Discount</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              </div>
            </div>

            {/* In-Stock Toggle */}
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-stone-700 select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 rounded-md border-stone-300 text-amber-800 accent-amber-800 focus:ring-amber-700"
              />
              In Stock Only
            </label>
          </div>

          {/* Right: Count and Clear */}
          <div className="flex items-center gap-3">
            {(selectedCategory !== 'All' || searchTerm || inStockOnly || sortBy !== 'featured') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                <RotateCcw size={12} /> Clear
              </button>
            )}
            <span className="text-sm text-stone-500">{displayedProducts.length} on this page</span>
          </div>
        </div>

        {/* Product Grid Area */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse overflow-hidden rounded-3xl border border-stone-200/60 bg-white p-4"
              >
                <div className="aspect-square rounded-2xl bg-stone-100" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-20 rounded bg-stone-100" />
                  <div className="h-5 w-4/5 rounded bg-stone-100" />
                  <div className="h-4 w-1/2 rounded bg-stone-100" />
                </div>
                <div className="mt-6 flex justify-between">
                  <div className="h-8 w-24 rounded bg-stone-100" />
                  <div className="h-8 w-20 rounded bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedProducts.map((product) => {
              const discount = discountPercent(product);
              const price = effectivePrice(product);
              const inCartQty = cartQuantities.get(product.id) ?? 0;
              const isWished = wishlist.includes(product.id);
              const isTogglingWish = wishlistLoading === product.id;
              const isOutOfStock = product.inStock === false || (product.inStock === undefined && product.quantity !== undefined && product.quantity <= 0);
              const isLowStock = !isOutOfStock && product.quantity !== undefined && product.quantity > 0 && product.quantity <= 5;

              return (
                <article
                  key={product.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-2xs transition duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-950/5"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square w-full overflow-hidden bg-[#f7f2ea]">
                    <Link
                      href={`/products/${product.id}`}
                      aria-label={`View ${product.name}`}
                      className="block h-full w-full cursor-pointer"
                    >
                      <img
                        src={getProductImage(product.image_url)}
                        alt={product.name}
                        className="h-full w-full object-cover p-2 transition duration-500 group-hover:scale-105"
                      />
                    </Link>

                    {/* Top Badges */}
                    <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1.5">
                      {discount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold tracking-tight text-white shadow-xs">
                          <Flame size={12} className="fill-white" /> {discount}% OFF
                        </span>
                      )}
                      {isOutOfStock ? (
                        <span className="rounded-full bg-stone-800/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs backdrop-blur-xs">
                          Out of stock
                        </span>
                      ) : isLowStock ? (
                        <span className="rounded-full bg-amber-700/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs backdrop-blur-xs">
                          Only {product.quantity} left
                        </span>
                      ) : null}
                    </div>

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={(e) => void handleToggleWishlist(e, product.id)}
                      disabled={isTogglingWish}
                      aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
                      className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-stone-200/70 bg-white/90 text-stone-600 shadow-2xs backdrop-blur-xs transition hover:scale-110 hover:bg-white hover:text-rose-600 disabled:opacity-50"
                    >
                      <Heart
                        size={17}
                        className={
                          isWished ? 'fill-rose-600 text-rose-600' : 'transition-colors'
                        }
                      />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                          {product.category?.name || 'Sacred Item'}
                        </span>
                        <span className="text-[11px] font-medium text-stone-400">
                          #{product.id}
                        </span>
                      </div>

                      <Link
                        href={`/products/${product.id}`}
                        className="mt-2.5 block line-clamp-1 font-serif text-base font-semibold text-stone-900 transition hover:text-amber-800"
                        title={product.name}
                      >
                        {product.name}
                      </Link>

                      <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-stone-500">
                        {product.description || 'Authentic handcrafted sacred essential.'}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-stone-100 pt-4">
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                            Price
                          </span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-bold text-stone-900">
                              {money(price)}
                            </span>
                            {discount > 0 && (
                              <span className="text-xs text-stone-400 line-through">
                                {money(product.sellingPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        <Link
                          href={`/products/${product.id}`}
                          className="text-xs font-semibold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1"
                        >
                          Details <ArrowRight size={13} />
                        </Link>
                      </div>

                      <div className="mt-3.5">
                        {inCartQty > 0 ? (
                          <div className="flex w-full items-center justify-between rounded-xl bg-amber-50 p-1 ring-1 ring-amber-200">
                            <button
                              type="button"
                              onClick={(e) => handleDecreaseQuantity(e, product.id)}
                              aria-label="Decrease quantity"
                              className="grid h-8 w-8 place-items-center rounded-lg bg-white text-stone-700 shadow-2xs transition hover:bg-amber-100 hover:text-amber-950"
                            >
                              <Minus size={15} />
                            </button>
                            <span className="font-mono text-sm font-bold text-amber-950">
                              {inCartQty} in cart
                            </span>
                            <button
                              type="button"
                              disabled={isOutOfStock || inCartQty >= (product.quantity ?? 99)}
                              onClick={(e) => handleAddToCart(e, product.id)}
                              aria-label="Increase quantity"
                              className="grid h-8 w-8 place-items-center rounded-lg bg-amber-800 text-white shadow-2xs transition hover:bg-amber-900 disabled:opacity-40"
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={(e) => handleAddToCart(e, product.id)}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-amber-800 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
                          >
                            <ShoppingBag size={15} />
                            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-amber-900/20 bg-white px-6 py-16 text-center shadow-2xs">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-800">
              <Sparkles size={28} />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-semibold text-stone-900">
              No sacred items found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
              We couldn't find any products matching your selected search or filters. Try adjusting
              your query or explore another category.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-800 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-900"
            >
              <RotateCcw size={15} /> Reset all filters
            </button>
          </div>
        )}

        {/* Bottom Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-12">
            <PaginationNav
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={12}
              onPageChange={(newPage) => {
                setPage(newPage);
                const el = document.getElementById('catalog-view');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              isLoading={isLoading}
              itemLabel="sacred products"
            />
          </div>
        )}
      </div>

      {/* Brand Values / Trust Strip */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-800">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">100% Certified Authentic</h3>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Every Rudraksha and gemstone is lab-verified for purity and natural origin.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-800">
              <Flame size={20} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Vedic Energization</h3>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Sanctified with traditional Vedic rituals and mantra chants before dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-800">
              <PackageCheck size={20} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Reverent Packaging</h3>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Handled with devotion and packed securely to ensure safe sacred transit.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-800">
              <Truck size={20} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Pan-India Delivery</h3>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Quick express shipping and Cash on Delivery available across pin codes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
