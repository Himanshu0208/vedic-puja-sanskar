'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { logout } from '@/store/slices/authSlice';
import { toggleSidebar, setIsMobile, setSidebarOpen } from '@/store/slices/sidebarSlice';
import { RootState, AppDispatch } from '@/store';
import { 
  LucideArrowRightFromLine, 
  LucideArrowLeftFromLine,
  LucideLogOut } from 'lucide-react';
import { adminNavItems } from '@/constants/navItems';

export default function AdminSideBar() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { isOpen, isMobile } = useSelector((state: RootState) => state.sidebar);
  const dispatch = useDispatch<AppDispatch>();
  
  if(!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  // Set screen size on mount and resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      dispatch(setIsMobile(mobile));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Backdrop - visible only on mobile when sidebar is open */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 top-0 bg-black bg-opacity-50 z-30"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* Placeholder - changes width based on state */}
      {!isMobile && <div className={`transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`} />}

      {/* Sidebar */}
      <nav 
        className={`fixed left-0 top-0 pt-18 h-screen bg-linear-to-r from-yellow-50 to-yellow-100 shadow-md overflow-y-auto z-40 transition-all duration-300 ${
          isOpen 
            ? 'w-64' 
            : 'w-20'
        } ${
          isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'
        } ${
          isMobile && isOpen ? 'w-screen' : ''
        }`}
      >
        <ul className="flex flex-col gap-2 p-3 h-full justify-between">
          <div className="flex flex-col gap-2">
            {!isMobile && (<button
              onClick={() => dispatch(toggleSidebar())}
              className="flex items-center gap-3 bg-amber-900 text-white px-3 py-3 rounded-lg hover:bg-amber-800 transition-all whitespace-nowrap"
            >
              {isOpen ? <LucideArrowLeftFromLine size={24} /> : <LucideArrowRightFromLine size={24} />}
              <span className={`${isOpen ? 'opacity-100' : 'opacity-0 hidden'} transition-opacity duration-300`}>
                Collapse
              </span>
            </button>
            )}
            {adminNavItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.label}>
                  <a href={item.link} className="flex items-center gap-3 text-amber-900 px-3 py-3 rounded-lg hover:bg-white transition-all whitespace-nowrap">
                    <IconComponent size={24} className="shrink-0" />
                    <span className={`${isOpen ? 'opacity-100' : 'opacity-0 hidden'} transition-opacity duration-300`}>
                      {item.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </div>
          <li className="border-t-2 border-amber-200 pt-2">
            <button
              onClick={() => dispatch(logout())}
              className="w-full flex items-center gap-3 text-red-600 px-3 py-3 rounded-lg hover:bg-red-50 transition-all whitespace-nowrap font-semibold"
            >
              <LucideLogOut size={24} className="shrink-0" />
              <span className={`${isOpen ? 'opacity-100' : 'opacity-0 hidden'} transition-opacity duration-300`}>
                Logout
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}