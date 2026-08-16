'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShoppingCart } from 'lucide-react'; // Only keep necessary icons
import Link from 'next/link';

import { RootState, AppDispatch } from '@/store';
import { fetchCart, increaseQuantity, decreaseQuantity, removeItemFromCart } from '@/store/slices/orderSlice'; // Assuming these actions exist
import { ProductCartCard } from '@/components/common/ProductCartCard';

// Helper function for price formatting (can be moved to a utility file if used elsewhere)
const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(price);

export default function CartPage() {
    // Redux selectors
    const { cart, isLoading , error } = useSelector((state: RootState) => state.order); // Assuming loading and error states for cart
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        // Dispatch an action to load the cart when the component mounts
        dispatch(fetchCart());
    }, [dispatch]);

    const handleIncreaseQuantity = (productId: number) => {
        dispatch(increaseQuantity(productId));
        toast.success('Quantity increased!');
    };

    const handleDecreaseQuantity = (productId: number) => {
        dispatch(decreaseQuantity(productId));
        toast.success('Quantity decreased!');
    };

    const handleRemoveItem = (productId: number) => {
        dispatch(removeItemFromCart(productId));
    };

    // Calculate subtotal
    const subtotal = cart?.items.reduce((sum, item) => {
        const priceToUse = item.discountedPrice > 0 && item.discountedPrice < item.price ? item.discountedPrice : item.price;
        return sum + priceToUse * item.quantity;
    }, 0) || 0;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] p-8">
                <p className="text-lg text-gray-60">Loading your cart...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] p-8">
                <h1 className="text-4xl font-bold mb-4">Error</h1>
                <p className="text-lg text-red-600">Failed to load cart: {error}</p>
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (   
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] p-8">
                <ShoppingCart className="h-24 w-24 text-gray-400 mb-6" />
                <h1 className="text-4xl font-bold mb-4 text-gray-800">Your Cart is Empty</h1>
                <p className="text-lg text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
                <Link href="/" className="px-6 py-3 bg-violet-600 text-white rounded-lg shadow-md hover:bg-violet-700 transition duration-300">
                    Continue Shopping
                </Link>
            </div> 
        );
    }

    return (   
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8 text-gray-900">Your Shopping Cart</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {cart.items.map((item) => (
                        <ProductCartCard
                            key={item.productId}
                            item={item}
                            onIncrease={handleIncreaseQuantity}
                            onDecrease={handleDecreaseQuantity}
                            onRemove={handleRemoveItem}
                        />
                    ))}
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 sticky top-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">Order Summary</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between text-lg font-medium text-gray-700">
                                <span>Subtotal ({cart.items.length} items)</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            {/* Add shipping, tax, etc. if applicable */}
                            <div className="flex justify-between text-xl font-extrabold text-gray-900 border-t pt-4 mt-4">
                                <span>Total</span>
                                <span>{formatPrice(subtotal)}</span> {/* Assuming total is same as subtotal for now */}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="mt-8 w-full rounded-lg bg-yellow-600 py-3 text-lg font-semibold text-white shadow-md hover:bg-yellow-700 transition duration-300"
                            // onClick={() => handleCheckout()} // Add checkout logic here
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div> 
    );
}
