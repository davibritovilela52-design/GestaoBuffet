import React, { lazy, Suspense, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Sidebar from './components/Sidebar';
import { AlertsPanel } from './components/AlertsPanel';
import { AppAlert, useAlerts } from './hooks/useAlerts';

// Lazy loading de páginas
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Kanban = lazy(() => import('./pages/Kanban'));
const DealDetails = lazy(() => import('./pages/DealDetails'));
const Financials = lazy(() => import('./pages/Financials'));
const PublicForm = lazy(() => import('./pages/PublicForm'));
const ClosedDeals = lazy(() => import('./pages/ClosedDeals'));
const Settings = lazy(() => import('./pages/Settings'));
const Landing = lazy(() => import('./pages/Landing'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const ProtectedLayout = () => {
  const { user, isAuthenticated, isLoading, logout, needsOnboarding } = useAuth();
  const location = useLocation();
  const { alerts, resolveAlert, acceptInvitation, rejectInvitation } = useAlerts(user);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const handleResolveAlert = async (id: string) => {
    try {
      await resolveAlert(id);
    } catch (error) {
      alert("Erro ao resolver alerta.");
    }
  };

  const handleAcceptInvitation = async (alert: AppAlert) => {
    try {
      await acceptInvitation(alert);
    } catch (error: any) {
      window.alert("Erro ao aceitar convite: " + error.message);
    }
  };

  const handleRejectInvitation = async (alert: AppAlert) => {
    try {
      await rejectInvitation(alert);
    } catch (error: any) {
      window.alert("Erro ao recusar convite: " + error.message);
    }
  };

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if user has no org
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  const getPageTitle = (path: string) => {
    const p = path.split('/')[1];
    if (!p) return 'Painel de Controle';
    if (p === 'dashboard') return 'Painel de Controle';
    if (p === 'staffing') return 'Gestão de Equipe';
    if (p === 'events') return 'Eventos & Negócios';
    if (p === 'deals') return 'Histórico';
    if (p === 'financials') return 'Financeiro';
    if (p === 'settings') return 'Configurações';
    return 'Buffet Manager';
  };

  return (
    <div className="app-shell flex h-screen overflow-hidden text-[#111418] dark:text-white">
      <Sidebar />
      <main className="app-main flex-1 flex flex-col overflow-y-auto">
        <header className="app-header sticky top-0 z-10 flex items-center justify-between gap-3 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="font-display text-[#111418] dark:text-white text-xl sm:text-2xl font-black capitalize truncate">{getPageTitle(location.pathname)}</h2>
            {user.orgName && (
              <span className="hidden sm:inline-flex text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-bold border border-primary/10 whitespace-nowrap">
                {user.orgName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              type="button"
              aria-label={isAlertsOpen ? 'Fechar alertas' : 'Abrir alertas'}
              aria-expanded={isAlertsOpen}
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className="relative p-2.5 text-[#617589] hover:text-primary transition-colors hover:bg-white/70 dark:hover:bg-white/10 rounded-xl border border-transparent hover:border-primary/10"
            >
              <span className="material-symbols-outlined">notifications</span>
              {alerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 border-2 border-white dark:border-background-dark rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                  {alerts.length}
                </span>
              )}
            </button>
            <span className="hidden sm:inline text-sm font-bold">{user.name}</span>
            <span className="hidden md:inline-flex text-xs bg-white/70 dark:bg-white/10 px-2.5 py-1 rounded-full text-gray-600 dark:text-gray-300 font-bold border border-gray-200/70 dark:border-white/10">{user.role}</span>
            <button onClick={logout} className="text-sm text-red-500 hover:text-red-600 font-bold">Sair</button>
            <div className="hidden sm:block h-10 w-10 rounded-full bg-cover bg-center border-2 border-primary/20" style={{ backgroundImage: `url(${user.avatarUrl})` }}></div>
          </div>
        </header>

        {isAlertsOpen && (
          <AlertsPanel
            alerts={alerts}
            onResolve={handleResolveAlert}
            onAcceptInvitation={handleAcceptInvitation}
            onRejectInvitation={handleRejectInvitation}
            onClose={() => setIsAlertsOpen(false)}
            userRole={user.role}
          />
        )}
        <div className="app-content p-8">
          <Suspense fallback={<LoadingFallback />}>
            <Outlet context={{ user }} />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/public-request" element={<PublicForm />} />
            <Route path="/public-request/:orgSlug" element={<PublicForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Protected Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/staffing" element={<UserManagement />} />
              <Route path="/events" element={<Kanban />} />
              <Route path="/events/:id" element={<DealDetails />} />
              <Route path="/deals/closed" element={<ClosedDeals />} />
              <Route path="/financials" element={<Financials />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
}
