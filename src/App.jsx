import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Loader from './components/Common/Loader';
import './mobile.css';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./components/Auth/LoginPage'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const SignalsPage = lazy(() => import('./components/Signals/SignalsPage'));
const MarketOverview = lazy(() => import('./components/Market/MarketOverview'));
const CommunityPage = lazy(() => import('./components/Community/CommunityPage'));
const ProfilePage = lazy(() => import('./components/Profile/ProfilePage'));
const InfoPage = lazy(() => import('./components/Info/InfoPage'));

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem('authToken'))
  );
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    navigate(`/${tab}`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <>
      {isAuthenticated && (
        <Header onTabChange={handleTabChange} onLogout={handleLogout} />
      )}

      <main className="min-h-screen" style={{ background: '#050a10' }}>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route
              path="/login"
              element={!isAuthenticated ? <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} /> : <Navigate to="/dashboard" replace />}
            />

            {isAuthenticated ? (
              <>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/signal" element={<SignalsPage />} />
                <Route path="/market" element={<MarketOverview />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/help-center" element={<InfoPage page="help" />} />
                <Route path="/faq" element={<InfoPage page="faq" />} />
                <Route path="/contact" element={<InfoPage page="contact" />} />
                <Route path="/privacy" element={<InfoPage page="privacy" />} />
                <Route path="/terms" element={<InfoPage page="terms" />} />
                <Route path="/risk-disclosure" element={<InfoPage page="risk" />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </Suspense>
      </main>

      {isAuthenticated && <Footer />}
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
