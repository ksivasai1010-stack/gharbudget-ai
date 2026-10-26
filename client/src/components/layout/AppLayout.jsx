import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import BottomNav from './BottomNav.jsx';

export default function AppLayout() {
  const { family, loading } = useAuth();

  if (loading) return null;

  // Redirect to onboarding if no family yet
  if (!family) return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <TopBar />
      <main className="page-content">
        <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto page-enter">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
