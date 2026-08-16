export interface CartItem {
    productId: number,
    productImageURL: string,
    productName: string,
    productDescription: string,
    quantity: number,
    price: number,
    discountedPrice: number
}

export interface CartResponse {
	userId: number,
	items: CartItem[],
	totalPrice: number,
	discountedTotalPrice: number,
	totalSavings: number,
}

export interface AddItemToCartRequest {
	productId: number,
	quantity: number
}

export interface RemoveItemFromRequest {
	productId: number,
	quantity: number
}