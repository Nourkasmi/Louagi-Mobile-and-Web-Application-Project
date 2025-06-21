import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Import pages
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import DriversPage from './pages/DriversPage';
import TripsPage from './pages/TripsPage';
import BookingsPage from './pages/BookingsPage';
import StationsPage from './pages/StationsPage';
import DestinationsPage from './pages/DestinationsPage';
import SchedulesPage from './pages/SchedulesPage';
import QueuePage from './pages/QueuePage';
import PaymentsPage from './pages/PaymentsPage';
import SettingsPage from './pages/SettingsPage';

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
        return <DashboardPage />;
      case 'users':
        return <UsersPage />;
      case 'drivers':
        return <DriversPage />;
      case 'trips':
        return <TripsPage />;
      case 'bookings':
        return <BookingsPage />;
      case 'stations':
        return <StationsPage />;
      case 'destinations':
        return <DestinationsPage />;
      case 'schedules':
        return <SchedulesPage />;
      case 'queue':
        return <QueuePage />;
      case 'payments':
        return <PaymentsPage />;
      case 'settings':
        return <SettingsPage />;
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

        {/* Toast container will be added via react-hot-toast */}
      </div>
    </AuthProvider>
  );
}

export default App;