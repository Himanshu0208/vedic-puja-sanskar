'use client';

export default function Newsletter() {
  return (
    <section className="py-12 sm:py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-900 mb-3 sm:mb-4">Stay Connected</h3>
        <p className="text-amber-700 text-base sm:text-lg mb-6 sm:mb-8 px-2">Subscribe for spiritual tips, new products, and exclusive offers</p>
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
  );
}
