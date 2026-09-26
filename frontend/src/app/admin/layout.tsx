'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (mounted && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
    }
  }, [mounted, isAuthenticated, user?.role, router]);

  if (!mounted || !isAuthenticated || user?.role !== 'admin') {
    return <div className="grid min-h-[55vh] place-items-center text-sm text-stone-500">Loading admin workspace…</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">{children}</div>
    </div>
  );
}
