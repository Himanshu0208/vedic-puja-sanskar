'use client';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { hydrateAuth } from '@/store/slices/authSlice';
import { getStoredItem } from '@/utils/storage';
import { User } from '@/store/slices/authSlice';

export default function AuthInitializer() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const user = getStoredItem<User>('userData');
    dispatch(hydrateAuth({ user, token: user ? 'exists' : null }));
  }, [dispatch]);

  return null;
}