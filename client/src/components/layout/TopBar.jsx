import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { Bell, Menu, X, TrendingUp, LogOut } from 'lucide-react';
import {
  LayoutDashboard, Receipt, PieChart, Target, CreditCard,
  MessageSquare, BookOpen, Users, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const ALL_NAV = [
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

export default function TopBar() {
  const { t } = useTranslation();
  const { user, isDemo, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 lg:left-64 h-14 lg:h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-3 z-30">
        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 flex-1">
          <div className="w-7 h-7 bg-emerald-DEFAULT rounded-lg flex items-center justify-center">
            <TrendingUp size={14} className="text-white" />
          </div>
          <span className="font-bold text-navy-900 text-sm">GharBudget AI</span>
        </div>

        <div className="hidden lg:block flex-1" />

        {/* Demo badge */}
        {isDemo && (
          <span className="demo-badge hidden sm:flex">
            <span className="w-1.5 h-1.5 bg-amber-DEFAULT rounded-full animate-pulse-soft" />
            Demo Mode
          </span>
        )}

        {/* Notification placeholder */}
        <button className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <Bell size={18} />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-emerald-DEFAULT flex items-center justify-center text-white text-sm font-bold cursor-pointer">
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-navy-900 flex flex-col shadow-2xl animate-slide-up">
            <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-DEFAULT rounded-xl flex items-center justify-center">
                  <TrendingUp size={16} className="text-white" />
                </div>
                <span className="text-white font-bold">GharBudget AI</span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="text-navy-300 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {ALL_NAV.map(({ to, icon: Icon, key }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{t(key)}</span>
                </NavLink>
              ))}
            </nav>
            <div className="px-3 py-4 border-t border-white/10">
              <button onClick={handleLogout} className="sidebar-link w-full text-red-400">
                <LogOut size={16} />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
