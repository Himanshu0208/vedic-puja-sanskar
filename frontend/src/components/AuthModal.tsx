'use client';

import { useEffect, useState } from 'react';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex border-b border-gray-200 sticky top-0 bg-white">
          <button
            onClick={() => setCurrentTab('login')}
            className={`flex-1 py-4 font-semibold transition-colors ${
              currentTab === 'login'
                ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setCurrentTab('signup')}
            className={`flex-1 py-4 font-semibold transition-colors ${
              currentTab === 'signup'
                ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-6">
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
    </div>
  );
}
