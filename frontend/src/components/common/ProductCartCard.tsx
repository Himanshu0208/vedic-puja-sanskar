import { Minus, Plus, Trash2 } from 'lucide-react';

import Image from 'next/image';

import { getProductImage } from '@/utils/pathResolution'; 

import type { CartItem } from '@/types/order';

type ProductCartCardProps = {
  item: CartItem;
  onIncrease?: (productId: number) => void;
  onDecrease?: (productId: number) => void;
  onRemove?: (productId: number) => void;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(price);

export function ProductCartCard({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: ProductCartCardProps) {
  const hasDiscount = item.discountedPrice > 0 && item.discountedPrice < item.price;
  const currentPrice = hasDiscount ? item.discountedPrice : item.price;

  return (
    <article className="flex min-h-48 gap-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-40 sm:w-40">
        <img
          src={getProductImage(item.productImageURL)}
          alt={item.productName}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">
              {item.productName}
            </h3>
            {item.productDescription && (
              <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-600 sm:text-base">
                {item.productDescription}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onRemove?.(item.productId)}
            disabled={!onRemove}
            aria-label={`Remove ${item.productName} from cart`}
            className="rounded-md p-2 text-yellow-600 transition hover:bg-yellow-600 hover:text-yellow-200 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-yellow-300"
          >
            <Trash2 className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-4 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-extrabold text-yellow-700 sm:text-2xl">
              {formatPrice(currentPrice)}
            </span>
            {hasDiscount && (
              <span className="text-base font-medium text-gray-500 line-through">
                {formatPrice(item.price)}
              </span>
            )}
          </div>

          <div className="inline-flex w-fit items-center rounded-full bg-gray-100 p-1 shadow-inner ring-1 ring-gray-200">
            <button
              type="button"
              onClick={() => onDecrease?.(item.productId)}
              disabled={!onDecrease}
              aria-label={`Decrease ${item.productName} quantity`}
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:cursor-default disabled:hover:bg-white"
            >
              <Minus className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <span className="w-11 text-center text-base font-bold text-gray-900">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrease?.(item.productId)}
              disabled={!onIncrease}
              aria-label={`Increase ${item.productName} quantity`}
              className="grid h-10 w-10 place-items-center rounded-full bg-yellow-600 text-white shadow-sm transition hover:bg-yellow-700 disabled:cursor-default disabled:bg-violet-600"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
