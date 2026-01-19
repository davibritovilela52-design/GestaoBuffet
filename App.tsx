import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Sidebar from './components/Sidebar';
import { AlertsPanel } from './components/AlertsPanel';
import { dataService } from './services/dataService';
import { PaymentAlert, UserRole } from './types';
import { useState, useEffect } from 'react';

// Lazy loading de páginas
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Kanban = lazy(() => import('./pages/Kanban'));
const DealDetails = lazy(() => import('./pages/DealDetails'));
const Financials = lazy(() => import('./pages/Financials'));
const PublicForm = lazy(() => import('./pages/PublicForm'));
const ClosedDeals = lazy(() => import('./pages/ClosedDeals'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const ProtectedLayout = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const initAlerts = async () => {
        try {
          if (user.role === UserRole.ADMIN) {
            await dataService.checkAndGenerateAlerts();
          }
          const activeAlerts = await dataService.getAlerts(user);
          setAlerts(activeAlerts);
        } catch (error) {
          console.error("Failed to fetch alerts:", error);
        }
      };
      initAlerts();

      // Check every 10 minutes (staff invitations might be more frequent than payments)
      const interval = setInterval(initAlerts, 10 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleResolveAlert = async (id: string) => {
    if (!user) return;
    try {
      await dataService.resolveAlert(id, user);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      alert("Erro ao resolver alerta.");
    }
  };

  const handleAcceptInvitation = async (alert: any) => {
    if (!user) return;
    try {
      await dataService.acceptAssignment(alert.leadId, user.id);
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
      // Trigger a refresh if viewing DealDetails
    } catch (error: any) {
      window.alert("Erro ao aceitar convite: " + error.message);
    }
  };

  const handleRejectInvitation = async (alert: any) => {
    if (!user) return;
    try {
      await dataService.rejectAssignment(alert.leadId, user.id);
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
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

  const getPageTitle = (path: string) => {
    const p = path.split('/')[1];
    if (!p) return 'Painel de Controle';
    if (p === 'dashboard') return 'Painel de Controle';
    if (p === 'staffing') return 'Gestão de Equipe';
    if (p === 'events') return 'Eventos & Negócios';
    if (p === 'deals') return 'Histórico';
    if (p === 'financials') return 'Financeiro';
    return 'Buffet Manager';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-[#111418] dark:text-white">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-solid border-[#dbe0e6] dark:border-gray-800 px-8 py-4">
          <h2 className="text-[#111418] dark:text-white text-xl font-bold tracking-tight capitalize">{getPageTitle(location.pathname)}</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className="relative p-2 text-[#617589] hover:text-primary transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <span className="material-symbols-outlined">notifications</span>
              {alerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 border-2 border-white dark:border-background-dark rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                  {alerts.length}
                </span>
              )}
            </button>
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-bold">{user.role}</span>
            <button onClick={logout} className="text-sm text-red-500 hover:underline">Sair</button>
            <div className="h-10 w-10 rounded-full bg-cover bg-center border-2 border-primary/20" style={{ backgroundImage: `url(${user.avatarUrl})` }}></div>
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
        <div className="p-8">
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
            <Route path="/public-request" element={<PublicForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/staffing" element={<UserManagement />} />
              <Route path="/events" element={<Kanban />} />
              <Route path="/events/:id" element={<DealDetails />} />
              <Route path="/deals/closed" element={<ClosedDeals />} />
              <Route path="/financials" element={<Financials />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
}