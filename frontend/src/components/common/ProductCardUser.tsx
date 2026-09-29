import { useDispatch } from "react-redux";
import { ArrowRight, LucideEdit2, LucideTrash2, Minus, Plus } from "lucide-react";
import Link from 'next/link';

import { getProductImage } from "@/utils/pathResolution";
import { ProductResponse } from "@/types/product";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { AppDispatch } from "@/store";
import { openAuthModal } from "@/store/slices/authSlice";
import { decreaseQuantity, increaseQuantity } from "@/store/slices/orderSlice";

interface ProductCardUserProps {
  product: ProductResponse;
  handleEdit?: (product: ProductResponse) => void;
  handleDelete?: (productId: number) => void;
}

export const ProductCardUser = ({
  product,
  handleEdit,
  handleDelete,
}: ProductCardUserProps) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const { selectedProductQuantities } = useCart();
  const dispatch = useDispatch<AppDispatch>();
  const inCart = selectedProductQuantities ? selectedProductQuantities.has(product.id) : false;
  const quantity = selectedProductQuantities ? selectedProductQuantities.get(product.id) : 0;
  const isOutOfStock = product.inStock === false || (product.inStock === undefined && product.quantity !== undefined && product.quantity <= 0);

  const onIncreaseInCart = (productId : number) => {
    console.log('Increase in cart');
    dispatch(increaseQuantity(productId));
  }
  
  const onDecreaseInCart = (productId : number) => {
    console.log('Decrease in cart');
    dispatch(decreaseQuantity(productId));
  }

    
  return (
    <div
      key={product.id}
      className="group overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Image */}
      <Link href={`/products/${product.id}`} aria-label={`View ${product.name} details`} className="block h-52 overflow-hidden bg-[#f5f0e7]">
        <img
          src={getProductImage(product.image_url)}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>

      {/* Content */}
      <div className="p-5">
        <Link href={`/products/${product.id}`} className="mb-3 block line-clamp-2 text-lg font-semibold text-stone-900 transition hover:text-amber-800">{product.name}</Link>

        {/* Category and Rating */}
          <div className="mb-3 flex items-center">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
              {product.category.name}
            </span>
        </div>

        {/* Price and Stock */}
        <div className="mb-3 space-y-1">
          <div className="flex items-center gap-2">
            {product.offerPrice ? (
              <>
                <p className="text-xl font-bold text-red-600">
                  ₹{product.offerPrice}
                </p>
                <p className="text-sm line-through text-gray-400">
                  ₹{product.sellingPrice}
                </p>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">
                  {Math.round(
                    ((product.sellingPrice - product.offerPrice) / product.sellingPrice) *
                      100,
                  )}
                  % OFF
                </span>
              </>
            ) : (
              <p className="text-xl font-bold text-amber-600">
                ₹{product.sellingPrice}
              </p>
            )}
          </div>

        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        <Link href={`/products/${product.id}`} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-800 transition hover:text-amber-950">View full details <ArrowRight size={15}/></Link>

        {/* Actions */}
        <div className="flex gap-2 w-full justify-between">
          {isAuthenticated && isAdmin && handleDelete && handleEdit && (
            <>
              <button
                onClick={() => handleEdit(product)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-600 px-3 py-2 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
              >
                <LucideEdit2 size={16} />
                <span className="hidden sm:inline">Edit</span>
              </button>

              <button
                onClick={() => handleDelete(product.id)}
                className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-600 px-3 py-2 rounded-lg font-semibold hover:bg-red-200 transition-colors"
              >
                <LucideTrash2 size={16} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </>
          )}

          {isAuthenticated && inCart && (
            <div className="inline-flex w-full gap-10 items-center rounded-full bg-gray-100 p-1 shadow-inner ring-1 ring-gray-200">
              <button
                type="button"
                onClick={() => onDecreaseInCart?.(product.id)}
                disabled={!onDecreaseInCart}
                aria-label={`Decrease ${product.name} quantity`}
                className="flex-1 grid h-10 w-10 place-items-center rounded-full bg-white text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:cursor-default disabled:hover:bg-white"
              >
                <Minus className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <span className="w-11 text-center text-base font-bold text-gray-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onIncreaseInCart?.(product.id)}
                disabled={!onIncreaseInCart}
                aria-label={`Increase ${product.name} quantity`}
                className="flex-1 grid h-10 w-10 place-items-center rounded-full bg-yellow-600 text-white shadow-sm transition hover:bg-yellow-700 disabled:cursor-default disabled:bg-violet-600"
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          )
          }

          {((isAuthenticated && !inCart) ||  !isAuthenticated) && (
            <div className="flex gap-2 w-full justify-between">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => isAuthenticated ? onIncreaseInCart(product.id) : dispatch(openAuthModal('login'))}
                aria-label={`Add ${product.name} to cart`}
                className="flex-1 text-center text-sm font-semibold text-white bg-amber-600 px-3 py-2 rounded-lg hover:bg-amber-700 transition-colors disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
              >
                {isOutOfStock ? 'Out of Stock' : 'Add To Cart'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
