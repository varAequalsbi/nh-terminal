import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import { RouteSkeleton, StateScreen } from './components/Common/AsyncStates';
import ProtectedRoute from './routing/ProtectedRoute';
import { clearSession, readSession, writeSession } from './auth/session';
import { env } from './config/env';
import { authService } from './services/authService';
import './mobile.css';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./components/Auth/LoginPage'));
const SignupPage = lazy(() => import('./components/Auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./components/Auth/ForgotPasswordPage'));
const VerifyEmailPage = lazy(() => import('./components/Auth/VerifyEmailPage'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const SignalsPage = lazy(() => import('./components/Signals/SignalsPage'));
const MarketOverview = lazy(() => import('./components/Market/MarketOverview'));
const CommunityPage = lazy(() => import('./components/Community/CommunityPage'));
const ProfilePage = lazy(() => import('./components/Profile/ProfilePage'));
const InfoPage = lazy(() => import('./components/Info/InfoPage'));
const SettingsPage = lazy(() => import('./components/Settings/SettingsPage'));

function AppContent() {
  const [session, setSession] = useState(readSession);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session?.user?.id) return undefined;
    let active = true;
    const interval = window.setInterval(async () => {
      try {
        const refreshed = await authService.refreshToken();
        if (active && refreshed?.user) {
          writeSession(refreshed);
          setSession(refreshed);
        }
      } catch {
        // The shared API interceptor handles expired or reused sessions.
      }
    }, env.sessionRefreshInterval);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [session?.user?.id]);

  const handleTabChange = (tab) => {
    navigate(`/${tab}`);
  };

  const handleLogout = async () => {
    if (!window.confirm('Log out of NH Terminal?')) return;
    try {
      await authService.logout();
    } finally {
      clearSession();
      queryClient.clear();
      setSession(null);
      navigate('/login', { replace: true });
    }
  };

  const handleLoginSuccess = (nextSession) => {
    const resolved = nextSession?.user
      ? nextSession
      : {
          user: { id: 'demo-member', name: 'NH Member', email: '', role: 'member', tier: 'PRIME' },
        };
    writeSession(resolved);
    setSession(resolved);
  };

  const handleSessionUserUpdate = (user) => {
    const nextSession = { ...session, user: { ...session.user, ...user } };
    writeSession(nextSession);
    setSession(nextSession);
  };

  const protect = (element, roles) => (
    <ProtectedRoute session={session} roles={roles}>
      {element}
    </ProtectedRoute>
  );

  if (env.maintenanceMode) return <StateScreen state="maintenance" />;

  return (
    <>
      {session && <Header onTabChange={handleTabChange} onLogout={handleLogout} />}

      <main className="min-h-screen" style={{ background: '#050a10' }}>
        <Suspense
          fallback={<RouteSkeleton route={location.pathname.split('/')[1] || 'dashboard'} />}
        >
          <Routes>
            <Route
              path="/login"
              element={
                !session ? (
                  <LoginPage onLoginSuccess={handleLoginSuccess} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route
              path="/signup"
              element={
                !session ? (
                  <SignupPage onLoginSuccess={handleLoginSuccess} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route
              path="/forgot-password"
              element={!session ? <ForgotPasswordPage /> : <Navigate to="/dashboard" replace />}
            />
            <Route
              path="/verify-email"
              element={!session ? <VerifyEmailPage /> : <Navigate to="/dashboard" replace />}
            />
            <Route path="/" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
            <Route path="/dashboard" element={protect(<Dashboard />)} />
            <Route path="/signal" element={protect(<SignalsPage />)} />
            <Route path="/market" element={protect(<MarketOverview />)} />
            <Route path="/community" element={protect(<CommunityPage />)} />
            <Route path="/profile" element={protect(<ProfilePage />)} />
            <Route
              path="/settings"
              element={protect(<SettingsPage onSessionUpdate={handleSessionUserUpdate} />)}
            />
            <Route path="/help-center" element={protect(<InfoPage page="help" />)} />
            <Route path="/faq" element={protect(<InfoPage page="faq" />)} />
            <Route path="/contact" element={protect(<InfoPage page="contact" />)} />
            <Route path="/privacy" element={protect(<InfoPage page="privacy" />)} />
            <Route path="/terms" element={protect(<InfoPage page="terms" />)} />
            <Route path="/risk-disclosure" element={protect(<InfoPage page="risk" />)} />
            <Route path="*" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
          </Routes>
        </Suspense>
      </main>

      {session && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
