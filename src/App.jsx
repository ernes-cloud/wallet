import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import { Toaster } from '@/components/ui/toaster';
import AuthPage from '@/pages/AuthPage';
import LandingPage from '@/pages/LandingPage';
import DashboardLayout from '@/components/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import CarteraPage from '@/pages/CarteraPage';
import RebalancingCalculator from '@/pages/RebalancingCalculator';
import ProtectedRoute from '@/components/ProtectedRoute';
import SettingsPage from '@/pages/SettingsPage';
import FavoritesPage from '@/pages/FavoritesPage';
import NotificationsPage from '@/pages/NotificationsPage';

function App() {
  return (
    <SupabaseAuthProvider>
      <Helmet>
        <title>WealthFlow - Professional Portfolio Management</title>
        <meta name="description" content="Comprehensive wealth management platform." />
      </Helmet>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected Routes */}
          <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="cartera" element={<CarteraPage />} />
            <Route path="favoritos" element={<FavoritesPage />} />
            <Route path="notificaciones" element={<NotificationsPage />} />
            {/* REMOVED ASSETS ROUTE */}
            <Route path="rebalance" element={<RebalancingCalculator />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster />
    </SupabaseAuthProvider>
  );
}

export default App;