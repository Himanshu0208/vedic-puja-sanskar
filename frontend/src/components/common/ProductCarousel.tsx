"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { ProductResponse } from "@/types/product";
import { ProductCardUser } from "./ProductCardUser";

interface ProductCarouselProps {
  products: ProductResponse[];
  title?: string;
  subtitle?: string;
  badgeText?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({
  products,
  title = "Featured Sacred Collection",
  subtitle = "Handpicked spiritual essentials for your daily rituals and celebrations.",
  badgeText = "Curated for you",
  autoPlay = false,
  autoPlayInterval = 4000,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const checkScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

    const cardWidth = containerRef.current.firstElementChild?.clientWidth || clientWidth;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.max(0, Math.min(index, products.length - 1)));
  }, [products.length]);

  useEffect(() => {
    checkScroll();
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, products]);

  const scroll = (direction: "left" | "right") => {
    if (!containerRef.current) return;
    const { clientWidth } = containerRef.current;
    const scrollAmount = clientWidth * 0.85;
    containerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return;
    const children = containerRef.current.children;
    if (children[index]) {
      (children[index] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  };

  // Auto-play effect
  useEffect(() => {
    if (!autoPlay || isHovered || products.length <= 1) return;
    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scroll("right");
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, isHovered, products.length]);

  if (!products || products.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-[#fbf8f1] to-white px-5 py-14 sm:py-20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-roledescription="carousel"
      aria-label={title}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header with Title & Navigation buttons */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            {badgeText && (
              <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.2em] text-amber-800">
                <Sparkles size={14} className="text-amber-600" />
                {badgeText}
              </p>
            )}
            <h2 className="font-serif text-3xl font-medium text-stone-900 sm:text-4xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-stone-600">
                {subtitle}
              </p>
            )}
          </div>

          {/* Nav Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Previous products"
              className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-xs transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Next products"
              className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-xs transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Carousel track */}
        <div
          ref={containerRef}
          className="flex gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[280px] sm:w-[320px] md:w-[340px] shrink-0 snap-start"
            >
              <ProductCardUser product={product} />
            </div>
          ))}
        </div>

        {/* Indicator dots for quick visual cues */}
        {products.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {products.slice(0, Math.min(products.length, 10)).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? "w-7 bg-amber-800"
                    : "w-2 bg-stone-300 hover:bg-amber-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
