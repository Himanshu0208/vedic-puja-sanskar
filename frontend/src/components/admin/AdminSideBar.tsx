'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { setIsMobile, setSidebarOpen, toggleSidebar } from '@/store/slices/sidebarSlice';
import { RootState, AppDispatch } from '@/store';
import { adminNavItems } from '@/constants/navItems';

export default function AdminSideBar() {
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { isOpen, isMobile } = useSelector((state: RootState) => state.sidebar);
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const handleResize = () => dispatch(setIsMobile(window.innerWidth < 768));
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  if (!mounted || !isAuthenticated || user?.role !== 'admin') return null;

  return <>
    {isMobile && isOpen && <button aria-label="Close navigation" className="fixed inset-0 top-[68px] z-30 bg-stone-950/35 backdrop-blur-[2px] md:hidden" onClick={() => dispatch(setSidebarOpen(false))}/>}
    {!isMobile && <div className={`shrink-0 transition-[width] duration-200 ${isOpen ? 'w-64' : 'w-[76px]'}`}/>}
    <aside className={`fixed left-0 top-[68px] z-40 h-[calc(100vh-68px)] border-r border-amber-200/70 bg-gradient-to-b from-amber-50 via-orange-50/80 to-amber-100/50 transition-[width,transform] duration-200 ${isMobile ? `w-[min(82vw,320px)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}` : `${isOpen ? 'w-64' : 'w-[76px]'} translate-x-0`}`}>
      <nav aria-label="Admin navigation" className="flex h-full flex-col px-3 py-5">
        <div className="mb-4 flex items-center justify-between px-2">
          {isOpen && <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Workspace</p><p className="mt-1 text-xs text-stone-500">Manage your store</p></div>}
          {!isMobile && <button aria-label={isOpen ? 'Collapse navigation' : 'Expand navigation'} title={isOpen ? 'Collapse navigation' : 'Expand navigation'} onClick={() => dispatch(toggleSidebar())} className="grid h-9 w-9 place-items-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900">{isOpen ? <PanelLeftClose size={18}/> : <PanelLeftOpen size={18}/>}</button>}
        </div>
        <div className="space-y-1">
          {adminNavItems.map(({ label, icon: Icon, link }) => {
            const active = pathname === link || pathname.startsWith(`${link}/`);
            return <Link key={link} href={link} title={!isOpen ? label : undefined} aria-current={active ? 'page' : undefined} onClick={() => isMobile && dispatch(setSidebarOpen(false))} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-white/80 text-amber-950 shadow-sm ring-1 ring-inset ring-amber-200' : 'text-stone-700 hover:bg-white/60 hover:text-stone-950'} ${!isOpen ? 'justify-center' : ''}`}>
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} className="shrink-0"/>{isOpen && <span>{label}</span>}
            </Link>;
          })}
        </div>
        {isOpen && <div className="mt-auto rounded-xl border border-amber-200/70 bg-white/60 p-3"><p className="text-xs font-semibold text-stone-800">Vedic Puja Sanskar</p><p className="mt-1 text-[11px] text-stone-600">Store management</p></div>}
      </nav>
    </aside>
  </>;
}
