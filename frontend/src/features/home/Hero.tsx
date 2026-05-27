'use client';

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-yellow-50 via-white to-white py-12 sm:py-20 px-4">
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
  );
}
