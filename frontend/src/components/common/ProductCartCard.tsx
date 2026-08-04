export function ProductCartCard() {
    return (
        <div className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg">
            <img src={product.image} alt={product.name} className="w-16 h-16 object-cover" />
            <div className="flex-1">
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="text-gray-600">${product.price.toFixed(2)}</p>
            </div>
            <p className="text-lg font-bold">Qty: {quantity}</p>
        </div>
    );
}