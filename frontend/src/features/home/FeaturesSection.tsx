'use client';

export default function FeaturesSection() {
  const items = [
    { icon: '✨', title: '100% Authentic', desc: 'Genuine Rudraksh and sacred items sourced directly from trusted sources' },
    { icon: '🚚', title: 'Fast Delivery', desc: 'Quick and secure shipping to your doorstep with proper packaging' },
    { icon: '💝', title: 'Best Prices', desc: 'Affordable spiritual products without compromising on quality' },
  ];

  return (
    <section className="bg-gradient-to-r from-yellow-100 to-yellow-50 py-12 sm:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-900 text-center mb-8 sm:mb-12">Why Choose Us?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {items.map((it) => (
            <div key={it.title} className="bg-white p-6 sm:p-8 rounded-lg shadow-md text-center border-t-4 border-amber-600">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{it.icon}</div>
              <h4 className="text-lg sm:text-xl font-bold text-amber-900 mb-2">{it.title}</h4>
              <p className="text-amber-700 text-sm sm:text-base">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
