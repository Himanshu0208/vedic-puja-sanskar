
export default function Home() {
  return (
  <>
    {/* Hero Section */}
    <section className="bg-linear-to-b from-yellow-50 via-white to-white py-12 sm:py-20 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-amber-900 mb-4 sm:mb-6">
          Experience Sacred Spirituality
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-amber-700 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
          Authentic Rudraksh, traditional Malas, and complete Puja Path essentials for your spiritual journey
        </p>
        <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
          <button className="bg-amber-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-bold text-base sm:text-lg hover:bg-amber-700 transition-colors duration-200">
            🛍️ Shop Now
          </button>
          <button className="bg-white text-amber-600 border-2 border-amber-600 px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-bold text-base sm:text-lg hover:bg-yellow-50 transition-colors duration-200">
            📖 Learn More
          </button>
        </div>
      </div>
    </section>

    {/* Featured Products */}
    <section className="py-12 sm:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-900 text-center mb-8 sm:mb-12">
          Featured Products
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* {products.map((product) => (
            <div
            key={product.id}
            className="bg-gradient-to-br from-yellow-50 to-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-yellow-100 overflow-hidden"
            >
            <div className="bg-yellow-100 p-6 sm:p-8 text-center text-4xl sm:text-5xl md:text-6xl">
            {product.image}
            </div>
            <div className="p-4 sm:p-6">
            <h4 className="text-base sm:text-lg font-bold text-amber-900 mb-2 line-clamp-2">
            {product.name}
            </h4>
            <p className="text-amber-700 text-xs sm:text-sm mb-4 line-clamp-2">
            {product.description}
            </p>
            <div className="flex justify-between items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold text-amber-600">
            ₹{product.price}
            </span>
            <button
            onClick={addToCart}
            className="bg-amber-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-amber-700 transition-colors duration-200 text-xs sm:text-sm"
            >
            Add
            </button>
            </div>
            </div>
            </div>
            ))} */}
        </div>
      </div>
    </section>

    {/* Features Section */}
    <section className="bg-linear-to-r from-yellow-100 to-yellow-50 py-12 sm:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-900 text-center mb-8 sm:mb-12">
          Why Choose Us?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md text-center border-t-4 border-amber-600">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">✨</div>
            <h4 className="text-lg sm:text-xl font-bold text-amber-900 mb-2">
              100% Authentic
            </h4>
            <p className="text-amber-700 text-sm sm:text-base">
              Genuine Rudraksh and sacred items sourced directly from trusted sources
            </p>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md text-center border-t-4 border-amber-600">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🚚</div>
            <h4 className="text-lg sm:text-xl font-bold text-amber-900 mb-2">
              Fast Delivery
            </h4>
            <p className="text-amber-700 text-sm sm:text-base">
              Quick and secure shipping to your doorstep with proper packaging
            </p>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md text-center border-t-4 border-amber-600">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">💝</div>
            <h4 className="text-lg sm:text-xl font-bold text-amber-900 mb-2">
              Best Prices
            </h4>
            <p className="text-amber-700 text-sm sm:text-base">
              Affordable spiritual products without compromising on quality
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Newsletter Section */}
    <section className="py-12 sm:py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-900 mb-3 sm:mb-4">
          Stay Connected
        </h3>
        <p className="text-amber-700 text-base sm:text-lg mb-6 sm:mb-8 px-2">
          Subscribe for spiritual tips, new products, and exclusive offers
        </p>
        <div className="flex gap-2 flex-col sm:flex-row max-w-md mx-auto px-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 border-yellow-300 focus:outline-none focus:border-amber-600 bg-yellow-50 text-sm sm:text-base"
            />
          <button className="bg-amber-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-bold hover:bg-amber-700 transition-colors duration-200 text-sm sm:text-base">
            Subscribe
          </button>
        </div>
      </div>
    </section>

  </>
  );   
}
