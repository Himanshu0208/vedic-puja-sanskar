"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationNavProps {
  page: number;
  totalPages: number;
  total?: number;
  pageSize?: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
  itemLabel?: string;
  className?: string;
  compact?: boolean;
}

export const PaginationNav: React.FC<PaginationNavProps> = ({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  isLoading = false,
  itemLabel = "items",
  className = "",
  compact = false,
}) => {
  if (totalPages <= 1 && (!total || total === 0)) return null;

  // Calculate range e.g. "Showing 1-12 of 34"
  const startItem = pageSize ? (page - 1) * pageSize + 1 : undefined;
  const endItem = pageSize && total ? Math.min(page * pageSize, total) : undefined;

  // Generate page numbers to show (e.g. 1 ... 4 5 6 ... 10)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis-1");

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) pages.push("ellipsis-2");
      pages.push(totalPages);
    }
    return pages;
  };

  const handlePrev = () => {
    if (page > 1 && !isLoading) onPageChange(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages && !isLoading) onPageChange(page + 1);
  };

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-xs ${className}`}
    >
      {/* Left: Summary text */}
      <div className="text-sm text-stone-600">
        {total !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Showing <strong className="font-semibold text-stone-900">{total > 0 ? startItem : 0}</strong>–
            <strong className="font-semibold text-stone-900">{endItem}</strong> of{" "}
            <strong className="font-semibold text-stone-900">{total}</strong> {itemLabel}
          </span>
        ) : (
          <span>
            Page <strong className="font-semibold text-stone-900">{page}</strong> of{" "}
            <strong className="font-semibold text-stone-900">{Math.max(1, totalPages)}</strong>
          </span>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* First page button on larger screens */}
        {!compact && totalPages > 4 && (
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={page <= 1 || isLoading}
            aria-label="Go to first page"
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronsLeft size={16} />
          </button>
        )}

        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={page <= 1 || isLoading}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 shadow-2xs transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronLeft size={16} />
          <span className="hidden xs:inline">Prev</span>
        </button>

        {/* Page numbers (hidden on compact or very small screens) */}
        {!compact && (
          <div className="hidden items-center gap-1 md:flex">
            {getPageNumbers().map((p, idx) => {
              if (typeof p === "string") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1 text-sm text-stone-400 select-none">
                    …
                  </span>
                );
              }
              const isActive = p === page;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  disabled={isLoading}
                  aria-current={isActive ? "page" : undefined}
                  className={`h-9 min-w-9 rounded-xl px-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-amber-800 font-semibold text-white shadow-xs"
                      : "border border-stone-200 bg-white text-stone-700 hover:bg-amber-50 hover:text-amber-900"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        )}

        {/* Active page indicator on mobile */}
        {!compact && (
          <span className="px-1 text-xs font-semibold text-stone-700 md:hidden">
            {page}/{totalPages}
          </span>
        )}

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={page >= totalPages || isLoading}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 shadow-2xs transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight size={16} />
        </button>

        {/* Last page button on larger screens */}
        {!compact && totalPages > 4 && (
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages || isLoading}
            aria-label="Go to last page"
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronsRight size={16} />
          </button>
        )}
      </div>
    </nav>
  );
};
