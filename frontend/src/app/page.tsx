"use client";

import { getAllCategories } from "@/store/slices/categorySlice";
import { getAllProducts } from "@/store/slices/productSlice";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { ProductCardUser } from "@/components/common/ProductCardUser";
import { ProductCarousel } from "@/components/common/ProductCarousel";
import { PaginationNav } from "@/components/common/PaginationNav";
import { fetchCart } from "@/store/slices/orderSlice";
import { ArrowDown, ArrowRight, BadgeCheck, Heart, PackageCheck } from "lucide-react";

export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const [page, setPage] = useState(1);
  const { products, total, totalPages, isLoading } = useSelector((state: RootState) => state.product);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    dispatch(getAllCategories());
    dispatch(getAllProducts({ page, pageSize: 12 }));
  }, [dispatch, page]);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCart());
  }, [dispatch, isAuthenticated]);

  const safeProducts = products || [];

  return (
    <>
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden bg-[#fbf5e9] px-5 py-20 sm:py-28">
        <div aria-hidden="true" className="absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full border border-amber-900/10 sm:right-8 sm:top-8 sm:h-[34rem] sm:w-[34rem]" />
        <div aria-hidden="true" className="absolute -right-12 -top-20 -z-10 h-72 w-72 rounded-full border border-amber-900/10 sm:right-20 sm:top-20 sm:h-[28rem] sm:w-[28rem]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.2fr_.8fr]">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-900/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[.18em] text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> A little more meaning in every ritual
            </p>
            <h1 className="font-[var(--font-geist-sans)] text-4xl font-semibold leading-[1.08] tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
              Make space for <span className="font-serif italic text-amber-800">the sacred.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
              Thoughtfully chosen Rudraksha, malas, and puja essentials to bring a little more intention to your everyday rituals.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#shop" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-amber-800 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800">
                Explore the collection <ArrowRight size={17} />
              </a>
              <a href="#our-promise" className="inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold text-stone-700 transition hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800">
                Our promise <ArrowDown size={16} />
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-stone-600">
              <span className="inline-flex items-center gap-2"><BadgeCheck size={17} className="text-amber-800" /> Carefully selected</span>
              <span className="inline-flex items-center gap-2"><PackageCheck size={17} className="text-amber-800" /> Packed with care</span>
            </div>
          </div>
          <div className="relative mx-auto grid aspect-square w-full max-w-md place-items-center rounded-[2rem] bg-[#e9dcc3] shadow-[0_30px_80px_-35px_rgba(92,57,22,.45)]">
            <div className="absolute inset-4 rounded-[1.5rem] border border-white/50" />
            <div className="text-center">
              <div className="text-8xl sm:text-9xl" aria-hidden="true">🕉️</div>
              <p className="mt-5 font-serif text-2xl italic text-amber-950">Begin with intention</p>
              <p className="mt-2 text-sm tracking-[.2em] text-amber-900/60">VEDIC PUJA SANSKAR</p>
            </div>
            <div className="absolute -bottom-5 left-5 rounded-2xl border border-amber-900/5 bg-white px-4 py-3 shadow-lg sm:left-8">
              <p className="flex items-center gap-2 text-sm font-semibold text-stone-800"><Heart size={15} className="fill-amber-700 text-amber-700" /> Made for mindful living</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Carousel */}
      {safeProducts.length > 0 && (
        <ProductCarousel
          products={safeProducts}
          title="Curated Sacred Essentials"
          subtitle="Explore authentic malas, rudrakshas, and sanctified items popular among devotees."
          badgeText="Featured Highlights"
          autoPlay={true}
          autoPlayInterval={4500}
        />
      )}

      {/* All Products Collection / Catalog */}
      <section id="shop" className="scroll-mt-24 px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 flex flex-col justify-between gap-3 sm:mb-12 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-amber-800">Chosen with care</p>
              <h2 className="font-serif text-3xl text-stone-900 sm:text-4xl">Find your everyday sacred</h2>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <p className="max-w-sm text-sm leading-6 text-stone-500">Meaningful essentials for prayer, reflection, and the rituals that ground you.</p>
              <Link href="/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 transition hover:text-amber-950">
                View all items with filters <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {safeProducts.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {safeProducts.map((product) => (
                <ProductCardUser key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-amber-900/20 bg-[#fbf8f1] px-6 py-16 text-center">
              <p className="font-serif text-2xl text-stone-800">A thoughtful collection is on its way</p>
              <p className="mt-2 text-sm text-stone-500">Please check back soon.</p>
            </div>
          )}

          {/* Bottom Pagination Navigation */}
          {totalPages > 1 && (
            <div className="mt-10">
              <PaginationNav
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={12}
                onPageChange={(newPage) => {
                  setPage(newPage);
                  const el = document.getElementById("shop");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                isLoading={isLoading}
                itemLabel="products"
              />
            </div>
          )}
        </div>
      </section>

      {/* Brand Value / Promise */}
      <section id="our-promise" className="bg-[#f8f3e9] px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-amber-800">A promise in every parcel</p>
            <h2 className="font-serif text-3xl text-stone-900 sm:text-4xl">Grounded in what matters</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['✦', 'Selected with intention', 'Authentic spiritual essentials, sourced from people we trust.'],
              ['↗', 'Care in every delivery', 'Your order is packed thoughtfully and sent securely to your door.'],
              ['♡', 'Honest value', 'Meaningful pieces at considered prices, without compromising on care.'],
            ].map(([icon, title, description]) => (
              <article key={title} className="rounded-2xl border border-amber-900/5 bg-white p-7 sm:p-8">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-amber-50 font-serif text-xl text-amber-800">{icon}</span>
                <h3 className="mt-5 text-lg font-semibold text-stone-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
