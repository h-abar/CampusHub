import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ServiceRequestPage from './pages/ServiceRequestPage';
import VenuesPage from './pages/VenuesPage';
import TrackPage from './pages/TrackPage';
import DiriyahCenterPage from './pages/DiriyahCenterPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ensureInitialized } from './utils/storage';

ensureInitialized();

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<LandingPage />} />
              <Route path="diriyah-center" element={<DiriyahCenterPage />} />
              <Route path="services" element={<ServiceRequestPage />} />
              <Route path="venues" element={<VenuesPage />} />
              <Route path="track" element={<TrackPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
