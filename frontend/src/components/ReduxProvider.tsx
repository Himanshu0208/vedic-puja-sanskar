'use client';

import { ReactNode, useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from '@/store';
import type { AppDispatch } from '@/store';
import { hydrateAuth } from '@/store/slices/authSlice';

export function ReduxProvider({ children }: { children: ReactNode }) {
  console.log('ReduxProvider rendered');
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
}

function AuthHydrator() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    let user = null;

    if (userData) {
      try {
        user = JSON.parse(userData);
      } catch {
        localStorage.removeItem('userData');
      }
    }

    dispatch(hydrateAuth({ user, token }));
  }, [dispatch]);

  return null;
}
