'use client';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
}

interface Props {
  products: Product[];
  onAdd: (productId: number) => void;
}

export default function ProductsGrid({ products, onAdd }: Props) {
  return (
    <section className="py-12 sm:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-900 text-center mb-8 sm:mb-12">Featured Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <article
              key={product.id}
              className="bg-gradient-to-br from-yellow-50 to-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-yellow-100 overflow-hidden"
            >
              <div className="bg-yellow-100 p-6 sm:p-8 text-center text-4xl sm:text-5xl md:text-6xl">{product.image}</div>
              <div className="p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-bold text-amber-900 mb-2 line-clamp-2">{product.name}</h4>
                <p className="text-amber-700 text-xs sm:text-sm mb-4 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xl sm:text-2xl font-bold text-amber-600">₹{product.price}</span>
                  <button
                    onClick={() => onAdd(product.id)}
                    className="bg-amber-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-amber-700 transition-colors duration-200 text-xs sm:text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
