import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Import pages
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import TripsPage from './pages/TripsPage'; // ✅ REAL: Connected to backend
import DriversPage from './pages/DriversPage'; // ✅ REAL: Connected to backend
import StationsPage from './pages/StationsPage'; // ✅ NEW: Real stations page

// Generic Page Component for unimplemented pages
const GenericPage = ({ title, subtitle }) => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      </div>
      <div className="bg-white rounded-lg shadow border p-6">
        <p className="text-gray-600">{title} interface coming soon...</p>
        <p className="text-sm text-gray-500 mt-2">
          This will connect to your backend API endpoints.
        </p>
      </div>
    </div>
  );
};

// Simple Router Component
const Router = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('dashboard');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Authenticated - show admin dashboard
  const renderPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardPage />; // ✅ REAL: Connected to backend
      case 'users':
        return <UsersPage />; // ✅ REAL: Connected to backend
      case 'trips':
        return <TripsPage />; // ✅ REAL: Connected to backend
      case 'drivers':
        return <DriversPage />; // ✅ REAL: Connected to backend
      case 'bookings':
        return <GenericPage title="Bookings Management" subtitle="Manage passenger bookings" />;
      case 'stations':
        return <StationsPage />; // ✅ REAL: Connected to backend
      case 'schedules':
        return <GenericPage title="Schedules Management" subtitle="Manage trip schedules" />;
      case 'queue':
        return <GenericPage title="Queue Management" subtitle="Manage driver queues" />;
      case 'payments':
        return <GenericPage title="Payments Management" subtitle="Manage payments and transactions" />;
      case 'settings':
        return <GenericPage title="Settings" subtitle="System configuration" />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Layout currentRoute={currentRoute} setCurrentRoute={setCurrentRoute}>
      {renderPage()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Router />
      </div>
    </AuthProvider>
  );
}

export default App;