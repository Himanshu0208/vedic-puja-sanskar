'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-t-2 border-yellow-200 py-8 sm:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div>
            <h4 className="font-bold text-amber-900 mb-3 sm:mb-4 text-base sm:text-lg">About Us</h4>
            <p className="text-amber-700 text-sm">
              Dedicated to providing authentic spiritual products for your sacred journey
            </p>
          </div>
          <div>
            <h4 className="font-bold text-amber-900 mb-3 sm:mb-4 text-base sm:text-lg">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shop" className="text-amber-700 hover:text-amber-900 transition-colors">Shop</Link></li>
              <li><Link href="/about" className="text-amber-700 hover:text-amber-900 transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-amber-700 hover:text-amber-900 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-amber-900 mb-3 sm:mb-4 text-base sm:text-lg">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq" className="text-amber-700 hover:text-amber-900 transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="text-amber-700 hover:text-amber-900 transition-colors">Shipping</Link></li>
              <li><Link href="/returns" className="text-amber-700 hover:text-amber-900 transition-colors">Returns</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-amber-900 mb-3 sm:mb-4 text-base sm:text-lg">Contact</h4>
            <div className="text-amber-700 text-sm space-y-1">
              <div>📧 hello@vedicpuja.com</div>
              <div>📞 +91 98765 43210</div>
              <div>🕐 Mon-Sun: 10 AM - 6 PM</div>
            </div>
          </div>
        </div>
        <div className="border-t-2 border-yellow-200 pt-6 sm:pt-8 text-center">
          <p className="text-amber-700 text-xs sm:text-sm">
            © 2024 Vedic Puja Sanskar. All rights reserved. 🙏
          </p>
        </div>
      </div>
    </footer>
  );
}
