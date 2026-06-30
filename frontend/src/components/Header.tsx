'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LucideUserPen, LucideLogIn, LucideSearch, LucideShoppingCart, LucideMenu, LucideX, LucideBellRing, LucideHeart, LucidePhone, LucideTruck, LucidePackage, LucideUser, LucideLayoutDashboard } from 'lucide-react';
import Link from 'next/link';

import { RootState, AppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { toggleSidebar } from '@/store/slices/sidebarSlice';
import AuthModal from '@/components/AuthModal';

interface HeaderProps {
  isLoggedIn?: boolean;
  onToggleAuth?: () => void;
  cartCount?: number;
  userEmail?: string;
  onLogout?: () => void;
}

export default function Header(_props: HeaderProps = {}) {
  void _props;

  const [mounted, setMounted] = useState(false);
  const [cartCount, setCartCount] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    setMounted(true);
  }, [])
  
  // Redux selectors
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const safeUser = mounted ? user : null;
  const safeisAuthenticated = mounted ? isAuthenticated : false;
  
  const dispatch = useDispatch<AppDispatch>();
  
  const handleOpenAuthModal = (tab: 'login' | 'signup' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleLogoutClick = () => {
    dispatch(logout());
    toast.success('Logged out successfully!');
  };

  const handleMenuClick = () => {
    if (safeUser?.role === 'admin') {
      dispatch(toggleSidebar());
    } else {
      setIsMenuOpen(!isMenuOpen);
    }
  };

  const addToCart = () => {
    if (!safeisAuthenticated) {
      handleOpenAuthModal('login');
      return;
    }
    setCartCount(cartCount + 1);
  };


  type Visibility = 'always' | 'guest' | 'user' | 'admin';

  const navItems = [
    { label: 'Contact Us',  icon: LucidePhone,   visibleTo: ['always'],         showOn: 'both', link: '#' },
    { label: 'Track Order', icon: LucideTruck,   visibleTo: ['guest'],  showOn: 'both', link: '#' },
    { label: 'My Orders',   icon: LucidePackage, visibleTo: ['guest'],           showOn: 'both', link: '#' },
    { label: 'Dashboard',   icon: LucideLayoutDashboard,  visibleTo: ['admin'],          showOn: 'both', link: '#' },
    { label: 'Profile',     icon: LucideUser,    visibleTo: ['user', 'admin'],  showOn: 'mobile', link: '#' },
    { label: 'Login',       icon: LucideLogIn,   visibleTo: ['guest'],          showOn: 'mobile', link: '#' },
  ];

  const role: Visibility = !safeisAuthenticated ? 'guest' : safeUser?.role === 'admin' ? 'admin' : 'user';

  const visibleNavItems = navItems.filter(item => item.visibleTo.includes('always') || item.visibleTo.includes(role));

  return (
    <header className="sticky top-0 z-50 bg-linear-to-r from-yellow-100 to-yellow-50 shadow-md">
      <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center gap-2 sm:gap-4">
          <button
            onClick={handleMenuClick}
            className="sm:hidden bg-amber-600 text-white px-1 py-1.5 rounded-lg font-semibold hover:bg-amber-700 transition-colors text-lg"
          >
            {isMenuOpen ? <LucideX /> : <LucideMenu />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <span className="text-2xl sm:text-3xl shrink-0">🕉️</span>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-sm font-bold text-amber-900 truncate">Vedic Puja</h1>
              <p className="text-xs text-amber-700 line-clamp-1">Sacred Rudraksh & Puja Path</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {visibleNavItems.filter(item => item.showOn !== 'mobile').map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.label}
                  className="text-amber-900 px-4 py-2 rounded-lg font-semibold hover:bg-white transition-colors text-sm"
                >
                  <Link href={item.link}>
                    <IconComponent className="inline mr-2" size={18} />
                    {item.label}
                  </Link>
                </button>
              );
            })
            }
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="bg-white text-amber-900 px-3 py-1.5 rounded-lg border-2 border-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition-colors text-sm"
              />
              <button className="absolute right-3 top-2.5 text-xl"><LucideSearch /></button>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search Icon (Mobile) */}
            <button className="lg:hidden text-amber-900 rounded-lg font-semibold hover:bg-yellow-50 transition-colors text-sm sm:text-base">
              <LucideSearch />
            </button>

            {/* User Info / Auth Button */}
            {safeisAuthenticated ? (
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={handleLogoutClick}
                  title={`Logout`}
                  className="flex gap-1 text-amber-900 px-2 sm:px-1 py-1.5 sm:py-1 rounded-lg font-semibold hover:bg-yellow-700 transition-colors duration-200 text-sm sm:text-base"
                >
                  <LucideUserPen className="my-auto"/> 
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleOpenAuthModal('login')}
                className="hidden sm:flex gap-2 bg-amber-600 text-white px-1 sm:px-3 py-1.5 sm:py-1 rounded-lg font-semibold hover:bg-amber-700 transition-colors duration-200 text-sm sm:text-base"
              >
                <LucideLogIn className="my-auto font-bold text-xl" />
                <span>Login</span>
              </button>
            )}

            {/* Notification */}
            { safeisAuthenticated && <div className="relative">
              <button className="flex gap-2 text-amber-900 rounded-lg font-semibold hover:bg-yellow-50 transition-colors text-sm sm:text-base">
                <LucideBellRing className="my-auto font-bold text-lg" />
                {/* <span className="hidden sm:inline">Notifications</span> */}
              </button>
            </div>
            }

            {/* Favorite */}
            <div className="relative" onClick={safeisAuthenticated ? addToCart : () => handleOpenAuthModal('login')}>
              <button className="flex gap-2 text-amber-900 rounded-lg font-semibold hover:bg-yellow-50 transition-colors text-sm sm:text-base">
                <LucideHeart className="my-auto font-bold text-lg"/>
              </button>
            </div>

            {/* Cart */}
            {safeUser?.role !=='admin' && (<div className="relative" onClick={safeisAuthenticated ? addToCart : () => handleOpenAuthModal('login')  }>
              <button className="flex gap-2 text-amber-900 rounded-lg font-semibold hover:bg-yellow-50 transition-colors text-sm sm:text-base">
                <LucideShoppingCart className="my-auto font-bold text-lg" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>)}
            
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={`${role === 'admin' ? '' : 'lg:hidden'} mt-4 pt-4 border-t-2 border-yellow-200`}>
            <div className="flex flex-col gap-2">
              {visibleNavItems.filter(item => item.showOn !== 'desktop').map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.label}
                    className="w-full text-amber-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-50 transition-colors text-sm text-left"
                  >
                    <Link href={item.link}>
                      <IconComponent className="inline mr-2" size={18} />
                      {item.label}
                    </Link>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        initialTab={authModalTab}
      />
    </header>
  );
}
