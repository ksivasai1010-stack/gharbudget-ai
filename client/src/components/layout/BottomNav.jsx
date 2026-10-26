import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Receipt, Target, MessageSquare, MoreHorizontal } from 'lucide-react';

const PRIMARY_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
  { to: '/expenses', icon: Receipt, key: 'nav.expenses' },
  { to: '/goals', icon: Target, key: 'nav.goals' },
  { to: '/coach', icon: MessageSquare, key: 'nav.coach' },
  { to: '/settings', icon: MoreHorizontal, key: 'nav.more' },
];

export default function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 shadow-nav flex items-center lg:hidden z-40">
      {PRIMARY_NAV.map(({ to, icon: Icon, key }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors
            ${isActive ? 'text-emerald-DEFAULT' : 'text-gray-400 hover:text-gray-600'}`
          }
        >
          <Icon size={20} />
          <span className="text-[10px]">{t(key)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
