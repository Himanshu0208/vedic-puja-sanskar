'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Login from './Login';
import Signup from './Signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
  const [currentTab, setCurrentTab] = useState<'login' | 'signup'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setCurrentTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-stone-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="auth-title" className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-amber-100 bg-gradient-to-b from-amber-50 to-orange-50/80 shadow-2xl shadow-stone-950/20">
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50 px-6 pb-5 pt-6 sm:px-8">
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-orange-200/50 blur-2xl"/>
          <button onClick={onClose} aria-label="Close sign in dialog" className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-900"><X size={18}/></button>
          <div className="relative flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-2xl">🕉️</span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Vedic Puja Sanskar</p><p className="mt-0.5 text-sm text-stone-500">Your sacred journey starts here</p></div></div>
        </div>
        <div className="bg-gradient-to-b from-amber-50/70 to-orange-50/40 px-6 pb-7 sm:px-8">
        <div role="tablist" aria-label="Choose authentication method" className="mb-5 grid grid-cols-2 rounded-xl border border-amber-100 bg-amber-100/70 p-1">
          <button
            role="tab"
            aria-selected={currentTab === 'login'}
            onClick={() => setCurrentTab('login')}
            className={`rounded-lg py-2.5 text-sm font-semibold transition ${
              currentTab === 'login'
                ? 'bg-white text-amber-950 shadow-sm'
                : 'text-amber-900/65 hover:text-amber-950'
            }`}
          >
            Sign in
          </button>
          <button
            role="tab"
            aria-selected={currentTab === 'signup'}
            onClick={() => setCurrentTab('signup')}
            className={`rounded-lg py-2.5 text-sm font-semibold transition ${
              currentTab === 'signup'
                ? 'bg-white text-amber-950 shadow-sm'
                : 'text-amber-900/65 hover:text-amber-950'
            }`}
          >
            Create account
          </button>
        </div>

        <div>
          {currentTab === 'login' ? (
            <Login
              onClose={onClose}
              onSwitchToSignup={() => setCurrentTab('signup')}
            />
          ) : (
            <Signup
              onClose={onClose}
              onSwitchToLogin={() => setCurrentTab('login')}
            />
          )}
        </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
