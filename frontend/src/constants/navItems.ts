import {
  LucidePhone,
  LucideTruck,
  LucidePackage,
  LucideUser,
  LucideLogIn,
  LucideLayoutDashboard,
  LucideUsers,
  LucidePackagePlus,
  LucideChartLine,
  LucidePackageCheck,
  LucideMessageCircleHeart,
  LucideArrowLeftFromLine,
} from 'lucide-react';

export const headerNavItems = [
  { label: 'Contact Us', icon: LucidePhone, link: '/contact' },
  { label: 'Track Order', icon: LucideTruck, link: '/track-order' },
  { label: 'My Orders', icon: LucidePackage, link: '/orders' },
  { label: 'Profile', icon: LucideUser, link: '/profile' },
  { label: 'Login', icon: LucideLogIn, link: '/login' },
];

export const adminNavItems = [
  { label: 'Dashboard', icon: LucideLayoutDashboard, link: '/admin/dashboard' },
  { label: 'Users', icon: LucideUsers, link: '/admin/users' },
  { label: 'Products', icon: LucidePackagePlus, link: '/admin/products' },
  { label: 'Reports', icon: LucideChartLine, link: '/admin/reports' },
  { label: 'Orders', icon: LucidePackageCheck, link: '/admin/orders' },
  { label: 'Feedbacks', icon: LucideMessageCircleHeart, link: '/admin/feedbacks' },
];
