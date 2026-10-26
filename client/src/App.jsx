import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext.jsx';

// Layout
import AppLayout from './components/layout/AppLayout.jsx';

// Pages
import LandingPage from './pages/Landing.jsx';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx';
import OnboardingPage from './pages/Onboarding.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import ExpensesPage from './pages/Expenses.jsx';
import BudgetPage from './pages/Budget.jsx';
import GoalsPage from './pages/Goals.jsx';
import LoansPage from './pages/Loans.jsx';
import CoachPage from './pages/Coach.jsx';
import EducationPage from './pages/Education.jsx';
import FamilyPage from './pages/Family.jsx';
import SettingsPage from './pages/Settings.jsx';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="skeleton w-12 h-12 rounded-full" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading, family } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to={family ? '/dashboard' : '/onboarding'} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
          success: { iconTheme: { primary: '#0F9D74', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Onboarding — auth required, no family yet */}
        <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />

        {/* App — auth + family required */}
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="coach" element={<CoachPage />} />
          <Route path="education" element={<EducationPage />} />
          <Route path="family" element={<FamilyPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
