import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Receipt, PieChart, Target, CreditCard,
  MessageSquare, BookOpen, Users, Settings, LogOut, TrendingUp
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
  { to: '/expenses', icon: Receipt, key: 'nav.expenses' },
  { to: '/budget', icon: PieChart, key: 'nav.budget' },
  { to: '/goals', icon: Target, key: 'nav.goals' },
  { to: '/loans', icon: CreditCard, key: 'nav.loans' },
  { to: '/coach', icon: MessageSquare, key: 'nav.coach' },
  { to: '/education', icon: BookOpen, key: 'nav.learning' },
  { to: '/family', icon: Users, key: 'nav.family' },
  { to: '/settings', icon: Settings, key: 'nav.settings' },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { user, family, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-navy-900 flex flex-col z-40 hidden lg:flex">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-DEFAULT rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">GharBudget AI</p>
            <p className="text-navy-300 text-xs">Every Rupee Has a Purpose</p>
          </div>
        </div>
      </div>

      {/* Family badge */}
      {family && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-navy-400 text-xs uppercase tracking-wide mb-1">Family</p>
          <p className="text-white text-sm font-medium truncate">{family.name}</p>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-emerald-DEFAULT/30 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-navy-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut size={16} />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
