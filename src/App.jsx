import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { CMSProvider } from './context/CMSContext';

import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import NotFound from './pages/NotFound';

import './styles/theme.css';
import './styles/index.css';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CurrencyProvider>
          <CMSProvider>
            <Routes>
              {/* Admin Portal Routes */}
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/products" element={<AdminDashboard />} />
              <Route path="/orders" element={<AdminDashboard />} />
              <Route path="/inventory" element={<AdminDashboard />} />
              <Route path="/customers" element={<AdminDashboard />} />
              <Route path="/cms" element={<AdminDashboard />} />
              <Route path="/media" element={<AdminDashboard />} />
              <Route path="/footer" element={<AdminDashboard />} />
              <Route path="/staff" element={<AdminDashboard />} />
              <Route path="/settings" element={<AdminDashboard />} />
              <Route path="/security" element={<AdminDashboard />} />
              <Route path="/audit-logs" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CMSProvider>
        </CurrencyProvider>
      </AuthProvider>
    </Router>
  );
}
