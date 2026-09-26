'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { LucideLogIn, LucideShoppingCart, LucideMenu, LucideX, LucidePhone, LucideTruck, LucidePackage, LucideUser, LucideLayoutDashboard } from 'lucide-react';
import Link from 'next/link';

import { RootState, AppDispatch } from '@/store';
import { closeAuthModal, logout, openAuthModal } from '@/store/slices/authSlice';
import { toggleSidebar } from '@/store/slices/sidebarSlice';
import AuthModal from '@/components/AuthModal';
import { usePathname, useRouter } from 'next/navigation';

interface HeaderProps {
  isLoggedIn?: boolean;
  cartCount?: number;
  userEmail?: string;
  onLogout?: () => void;
}

export default function Header(_props: HeaderProps = {}) {
  void _props;

  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, [])
  
  // Redux selectors
  const { user, isAuthenticated, isAuthModalOpen, authModalTab } = useSelector((state: RootState) => state.auth);
  const { isOpen: isAdminSidebarOpen } = useSelector((state: RootState) => state.sidebar);
  const cart = useSelector((state: RootState) => state.order.cart);
  const cartCount = cart?.items.reduce((count, item) => count + item.quantity, 0) ?? 0;
  
  const safeUser = mounted ? user : null;
  const safeisAuthenticated = mounted ? isAuthenticated : false;
  
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();

  const handleCloseAuthModal = () => {
    dispatch(closeAuthModal());
  };

  const handleLogoutClick = () => {
    dispatch(logout());
  };

  const handleMenuClick = () => {
    if (safeUser?.role === 'admin') {
      dispatch(toggleSidebar());
    } else {
      setIsMenuOpen(!isMenuOpen);
    }
  };

  const handleCartClick = () => {
    if (!safeisAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }

    router.push('/cart');
  }

  type Visibility = 'always' | 'guest' | 'user' | 'admin';

  const navItems = [
    { label: 'Contact Us',  icon: LucidePhone,   visibleTo: ['always'],         showOn: 'both', link: '#' },
    { label: 'Track Order', icon: LucideTruck,   visibleTo: ['guest'],  showOn: 'both', link: '/orders' },
    { label: 'My Orders',   icon: LucidePackage, visibleTo: ['user', 'admin'],   showOn: 'both', link: '/orders' },
    { label: 'Dashboard',   icon: LucideLayoutDashboard,  visibleTo: ['admin'],          showOn: 'both', link: '/admin/dashboard' },
    { label: 'Profile',     icon: LucideUser,    visibleTo: ['user', 'admin'],  showOn: 'mobile', link: '#' },
    { label: 'Login',       icon: LucideLogIn,   visibleTo: ['guest'],          showOn: 'mobile', link: '#' },
  ];

  const role: Visibility = !safeisAuthenticated ? 'guest' : safeUser?.role === 'admin' ? 'admin' : 'user';

  const visibleNavItems = navItems.filter(item => item.visibleTo.includes('always') || item.visibleTo.includes(role));

  if (pathname.startsWith('/admin')) {
    return <header className="sticky top-0 z-50 border-b border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 backdrop-blur">
      <div className="flex h-[68px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button onClick={handleMenuClick} aria-label="Toggle admin navigation" className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 text-stone-700 transition hover:bg-stone-50 md:hidden">{isAdminSidebarOpen ? <LucideX size={19}/> : <LucideMenu size={19}/>}</button>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-xl">🕉️</span>
          <div><p className="text-sm font-bold tracking-tight text-stone-900">Vedic Puja Sanskar</p><p className="text-xs text-stone-500">Store administration</p></div>
        </div>
        <div className="flex items-center gap-3"><span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">Admin workspace</span><button onClick={handleLogoutClick} className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700">Sign out</button></div>
      </div>
    </header>;
  }

  return <header className="sticky top-0 z-50 border-b border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 shadow-sm backdrop-blur">
    <nav className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={handleMenuClick} aria-label={isMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={isMenuOpen} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-200 bg-white/70 text-stone-700 transition hover:bg-white md:hidden">{isMenuOpen ? <LucideX size={19}/> : <LucideMenu size={19}/>}</button>
        <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-xl">🕉️</span>
          <span className="min-w-0"><span className="block truncate text-sm font-bold tracking-tight text-stone-900 sm:text-base">Vedic Puja Sanskar</span><span className="hidden text-[11px] text-stone-500 sm:block">Sacred essentials for your home</span></span>
        </Link>
      </div>

      <div className="hidden items-center gap-1 md:flex">
        {visibleNavItems.filter((item) => item.showOn !== 'mobile').map(({ label, icon: Icon, link }) => <Link key={label} href={link} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${pathname === link ? 'bg-white/80 text-amber-950 shadow-sm' : 'text-stone-700 hover:bg-white/60 hover:text-stone-950'}`}><Icon size={16} strokeWidth={1.8}/>{label}</Link>)}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {safeisAuthenticated && <span className="hidden max-w-36 truncate rounded-full bg-stone-100 px-3 py-2 text-xs font-medium text-stone-600 lg:block">{safeUser?.email}</span>}
        {safeUser?.role !== 'admin' && <button onClick={handleCartClick} aria-label="Open cart" className="relative grid h-10 w-10 place-items-center rounded-xl border border-amber-200 bg-white/70 text-stone-700 transition hover:bg-white hover:text-amber-900"><LucideShoppingCart size={19}/>{cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-800 px-1 text-[10px] font-bold text-white">{cartCount}</span>}</button>}
        {safeisAuthenticated ? <button onClick={handleLogoutClick} className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-red-50 hover:text-red-700 sm:inline-flex">Sign out</button> : <button onClick={() => dispatch(openAuthModal('login'))} className="hidden items-center gap-2 rounded-xl bg-stone-900 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-900 sm:inline-flex"><LucideLogIn size={16}/>Sign in</button>}
      </div>
    </nav>

    {isMenuOpen && <div className="border-t border-amber-200/70 bg-gradient-to-b from-amber-50 to-orange-50 px-4 py-3 shadow-lg md:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-1">{visibleNavItems.map(({ label, icon: Icon, link }) => <Link key={label} href={link} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-stone-700 transition hover:bg-white/80 hover:text-amber-900"><Icon size={18}/>{label}</Link>)}{safeisAuthenticated ? <button onClick={() => { setIsMenuOpen(false); handleLogoutClick(); }} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-stone-600 hover:bg-red-50 hover:text-red-700">Sign out</button> : <button onClick={() => { setIsMenuOpen(false); dispatch(openAuthModal('login')); }} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-amber-900 hover:bg-white/80"><LucideLogIn size={18}/>Sign in</button>}</div></div>}

    <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuthModal} initialTab={authModalTab}/>
  </header>;
}
