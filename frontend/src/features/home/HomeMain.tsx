'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';

import Hero from './Hero';
import ProductsGrid from './ProductsGrid';
import FeaturesSection from './FeaturesSection';
import Newsletter from './Newsletter';

const initialProducts = [
  { id: 1, name: 'Rudraksh Mala 108 Beads', price: 1499, image: '🔯', description: 'Traditional 108 bead Rudraksh mala for meditation and spiritual practice' },
  { id: 2, name: '5 Mukhi Rudraksh', price: 299, image: '🌰', description: 'Powerful 5-faced Rudraksh for peace and harmony' },
  { id: 3, name: 'Puja Path Essentials Kit', price: 2499, image: '🙏', description: 'Complete kit for daily puja rituals with all essential items' },
  { id: 4, name: 'Sandalwood Incense (Agarbatti)', price: 199, image: '🌿', description: 'Premium sandalwood incense for spiritual atmosphere' },
];

export default function HomeMain() {
  const [cartCount, setCartCount] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const handleOpenAuthModal = (tab: 'login' | 'signup' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => setIsAuthModalOpen(false);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully!');
  };

  const addToCart = (productId: number) => {
    if (!isAuthenticated) {
      handleOpenAuthModal('login');
      return;
    }
    setCartCount((c) => c + 1);
    toast.success('Added to cart');
  };

  return (
    <div className="min-h-screen bg-white">
      <Header
        isLoggedIn={isAuthenticated}
        onToggleAuth={() => handleOpenAuthModal('login')}
        cartCount={cartCount}
        userEmail={user?.email}
        onLogout={handleLogout}
      />

      {isAuthenticated && user && (
        <div className="bg-green-100 border-l-4 border-green-500 p-3 sm:p-4 max-w-7xl mx-auto mt-3 sm:mt-4 mx-2 sm:mx-auto rounded">
          <p className="text-green-800 font-semibold text-sm sm:text-base">✓ Welcome {user.email}! You are logged in</p>
        </div>
      )}

      <Hero />
      <ProductsGrid products={initialProducts} onAdd={addToCart} />
      <FeaturesSection />
      <Newsletter />

      <Footer />

      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuthModal} initialTab={authModalTab} />
    </div>
  );
}
