'use client';

import { useState } from 'react';

interface HeaderProps {
  isLoggedIn: boolean;
  onToggleAuth: () => void;
  cartCount: number;
  userEmail?: string;
  onLogout?: () => void;
}

export default function Header({ isLoggedIn, onToggleAuth, cartCount, userEmail, onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', icon: '🏠' },
    { label: 'About', icon: 'ℹ️' },
    { label: 'Contact Us', icon: '📞' },
    { label: 'Feedback', icon: '💬' },
  ];

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      onToggleAuth();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-yellow-100 to-yellow-50 shadow-md">
      <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center gap-2 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <span className="text-2xl sm:text-3xl flex-shrink-0">🕉️</span>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-sm font-bold text-amber-900 truncate">Vedic Puja</h1>
              <p className="text-xs text-amber-700 line-clamp-1">Sacred Rudraksh & Puja Path</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            {navItems.map((item) => (
              <button
                key={item.label}
                className="bg-white text-amber-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-50 transition-colors text-sm"
              >
                {item.label}
              </button>
            ))}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="bg-white text-amber-900 px-3 py-1.5 rounded-lg border-2 border-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition-colors text-sm"
              />
              <button className="absolute right-3 top-2.5 text-xl">🔍</button>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Search Icon (Mobile) */}
            <button className="lg:hidden bg-white text-amber-900 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-yellow-50 transition-colors text-sm sm:text-base">
              🔍
            </button>

            {/* Cart */}
            <div className="relative">
              <button className="bg-white text-amber-900 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-yellow-50 transition-colors text-sm sm:text-base">
                🛒 <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Info / Auth Button */}
            {isLoggedIn && userEmail ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right text-sm">
                  <p className="text-gray-700 font-semibold line-clamp-1">{userEmail}</p>
                  <p className="text-green-600 text-xs">●</p>
                </div>
                <button
                  onClick={handleLogoutClick}
                  title={`Logout: ${userEmail}`}
                  className="bg-red-600 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 text-sm sm:text-base"
                >
                  👤 <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onToggleAuth}
                className="bg-amber-600 text-white px-2 sm:px-6 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-amber-700 transition-colors duration-200 text-sm sm:text-base"
              >
                🔐 <span className="hidden sm:inline">Login</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden bg-amber-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-700 transition-colors text-lg"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t-2 border-yellow-200">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  className="w-full bg-white text-amber-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-50 transition-colors text-sm text-left"
                >
                  {item.icon} {item.label}
                </button>
              ))}
              <div className="relative mt-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full bg-white text-amber-900 px-4 py-2 rounded-lg border-2 border-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition-colors text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
