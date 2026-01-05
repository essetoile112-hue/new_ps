import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from '../pages/Auth.page';
import LandingPage from '../pages/LandingPage';
import Register from '../pages/Register.page';
import ForgotPassword from '../pages/ForgotPassword.page';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import Dashboard from '../pages/Dashboard.page';
import MobileDashboard from '../pages/MobileDashboard.page';
import HistoricalDataPage from '../pages/HistoricalData.page';

const NotReady = () => <div style={{ padding: 20 }}>Page not implemented yet</div>;

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      {/* Keep /register working but redirect to unified /auth route with mode=register */}
      <Route path="/register" element={<Navigate to="/auth?mode=register" replace />} />
      <Route path="/forgot" element={<ForgotPassword />} />

      {/* Map, dashboard and other pages are placeholders until implemented */}
      <Route path="/map" element={<NotReady />} />
      <Route path="/accueil" element={<NotReady />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/mobile" element={<ProtectedRoute><MobileDashboard /></ProtectedRoute>} />
      <Route path="/mobile-dashboard" element={<ProtectedRoute><MobileDashboard /></ProtectedRoute>} />
      <Route path="/historical-data" element={<ProtectedRoute><HistoricalDataPage /></ProtectedRoute>} />
      <Route path="/profil" element={<ProtectedRoute><NotReady /></ProtectedRoute>} />
      <Route path="/rapports" element={<ProtectedRoute><NotReady /></ProtectedRoute>} />
      <Route path="/analyse" element={<ProtectedRoute><NotReady /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><NotReady /></ProtectedRoute>} />

      <Route path="/" element={<LandingPage />} />
    </Routes>
  );
}
