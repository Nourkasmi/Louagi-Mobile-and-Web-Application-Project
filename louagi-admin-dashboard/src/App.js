// src/App.js - Updated with Destinations
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// ========================================
// LAZY LOAD PAGES FOR BETTER PERFORMANCE
// ========================================
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const TripsPage = lazy(() => import('./pages/TripsPage'));
const DriversPage = lazy(() => import('./pages/DriversPage'));
const StationsPage = lazy(() => import('./pages/StationsPage'));
const DestinationsPage = lazy(() => import('./pages/DestinationsPage')); // ✅ NEW: Added Destinations
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const SchedulesPage = lazy(() => import('./pages/SchedulesPage'));
const QueuePage = lazy(() => import('./pages/QueuePage'));

// ========================================
// ERROR BOUNDARY COMPONENT
// ========================================
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        if (process.env.NODE_ENV === 'development') {
            console.error('Error caught by boundary:', error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                An unexpected error occurred. Please refresh the page or try again later.
                            </p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                                >
                                    Refresh Page
                                </button>
                                <button
                                    onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                                    className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="mt-4 text-left">
                                    <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                                        Error Details (Development)
                                    </summary>
                                    <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-32">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// ========================================
// GENERIC PAGE COMPONENT WITH BETTER DESIGN
// ========================================
const GenericPage = ({ title, subtitle, icon: Icon, comingSoon = true }) => {
    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    {Icon && <Icon className="w-6 h-6 mr-2 text-blue-600" />}
                    {title}
                </h1>
                {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
            </div>

            <div className="bg-white rounded-lg shadow border p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                    {Icon ? (
                        <Icon className="h-8 w-8 text-blue-600" />
                    ) : (
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    )}
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {comingSoon ? `${title} Coming Soon` : title}
                </h3>

                <p className="text-gray-600 mb-4">
                    {comingSoon
                        ? `The ${title.toLowerCase()} interface is currently under development.`
                        : `Welcome to the ${title.toLowerCase()} section.`
                    }
                </p>

                <p className="text-sm text-gray-500">
                    This will connect to your backend API endpoints.
                </p>

                {comingSoon && (
                    <div className="mt-6 inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Feature in development
                    </div>
                )}
            </div>
        </div>
    );
};

// ========================================
// PAGE LOADING COMPONENT
// ========================================
const PageLoadingFallback = ({ pageName }) => (
    <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text={`Loading ${pageName}...`} />
    </div>
);

// ========================================
// ROUTE CONFIGURATION - UPDATED WITH DESTINATIONS
// ========================================
const routes = {
    dashboard: {
        component: DashboardPage,
        title: 'Dashboard',
        description: 'System overview and analytics'
    },
    users: {
        component: UsersPage,
        title: 'Users',
        description: 'User management and administration'
    },
    trips: {
        component: TripsPage,
        title: 'Trips',
        description: 'Trip management and tracking'
    },
    drivers: {
        component: DriversPage,
        title: 'Drivers',
        description: 'Driver management and verification'
    },
    bookings: {
        component: BookingsPage,
        title: 'Bookings',
        description: 'Booking management and processing'
    },
    stations: {
        component: StationsPage,
        title: 'Stations',
        description: 'Station management and configuration'
    },
    destinations: { // ✅ NEW: Added destinations route
        component: DestinationsPage,
        title: 'Destinations',
        description: 'Route and destination management'
    },
    schedules: {
        component: SchedulesPage,
        title: 'Schedules',
        description: 'Schedule management and planning'
    },
    queue: {
        component: QueuePage,
        title: 'Queue Management',
        description: 'Manage driver queues and positioning'
    },
    payments: {
        component: GenericPage,
        title: 'Payments',
        description: 'Payment processing and transaction management',
        props: {
            title: 'Payments Management',
            subtitle: 'Manage payments and transactions',
            icon: () => (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            )
        }
    },
    settings: {
        component: GenericPage,
        title: 'Settings',
        description: 'System configuration and preferences',
        props: {
            title: 'System Settings',
            subtitle: 'Configure system preferences and options',
            icon: () => (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        }
    }
};

// ========================================
// ENHANCED ROUTER COMPONENT
// ========================================
const Router = () => {
    const { isAuthenticated, loading, user } = useAuth();
    const [currentRoute, setCurrentRoute] = useState('dashboard');
    const [routeHistory, setRouteHistory] = useState(['dashboard']);

    // ========================================
    // ROUTE HISTORY MANAGEMENT
    // ========================================
    const navigateToRoute = (route) => {
        if (route !== currentRoute) {
            setRouteHistory(prev => [...prev.slice(-4), route]);
            setCurrentRoute(route);

            const routeConfig = routes[route];
            if (routeConfig) {
                document.title = `${routeConfig.title} - Louagi Admin Dashboard`;
            }
        }
    };

    // ========================================
    // KEYBOARD NAVIGATION
    // ========================================
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.altKey && !isNaN(event.key)) {
                const routeKeys = Object.keys(routes);
                const routeIndex = parseInt(event.key) - 1;
                if (routeIndex >= 0 && routeIndex < routeKeys.length) {
                    event.preventDefault();
                    navigateToRoute(routeKeys[routeIndex]);
                }
            }

            if (event.altKey && event.key === 'b' && routeHistory.length > 1) {
                event.preventDefault();
                const previousRoute = routeHistory[routeHistory.length - 2];
                navigateToRoute(previousRoute);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [routeHistory]);

    // ========================================
    // SET INITIAL DOCUMENT TITLE
    // ========================================
    useEffect(() => {
        document.title = 'Dashboard - Louagi Admin Dashboard';
    }, []);

    // ========================================
    // LOADING STATE
    // ========================================
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <LoadingSpinner size="large" text="Initializing dashboard..." />
                    <p className="mt-4 text-sm text-gray-600">
                        Verifying authentication and loading user data...
                    </p>
                </div>
            </div>
        );
    }

    // ========================================
    // NOT AUTHENTICATED
    // ========================================
    if (!isAuthenticated) {
        return (
            <ErrorBoundary>
                <LoginPage />
            </ErrorBoundary>
        );
    }

    // ========================================
    // RENDER PAGE COMPONENT
    // ========================================
    const renderPage = () => {
        const routeConfig = routes[currentRoute];

        if (!routeConfig) {
            console.warn(`Route '${currentRoute}' not found, falling back to dashboard`);
            setCurrentRoute('dashboard');
            return null;
        }

        const Component = routeConfig.component;
        const props = routeConfig.props || {};

        // ✅ UPDATED: Include DestinationsPage in lazy-loaded components
        if (Component === DashboardPage || Component === UsersPage ||
            Component === TripsPage || Component === DriversPage ||
            Component === StationsPage || Component === DestinationsPage ||
            Component === BookingsPage || Component === SchedulesPage || 
            Component === QueuePage) {

            return (
                <Suspense fallback={<PageLoadingFallback pageName={routeConfig.title} />}>
                    <ErrorBoundary>
                        <Component {...props} />
                    </ErrorBoundary>
                </Suspense>
            );
        }

        // For generic pages, render directly
        return (
            <ErrorBoundary>
                <Component {...props} />
            </ErrorBoundary>
        );
    };

    // ========================================
    // MAIN RENDER
    // ========================================
    return (
        <Layout
            currentRoute={currentRoute}
            setCurrentRoute={navigateToRoute}
            user={user}
            routeHistory={routeHistory}
        >
            {renderPage()}
        </Layout>
    );
};

// ========================================
// MAIN APP COMPONENT
// ========================================
function App() {
    // ========================================
    // GLOBAL ERROR HANDLING
    // ========================================
    useEffect(() => {
        const handleUnhandledRejection = (event) => {
            console.error('Unhandled promise rejection:', event.reason);

            if (process.env.NODE_ENV === 'development') {
                console.error('Full error details:', event);
            }

            event.preventDefault();
        };

        const handleError = (event) => {
            console.error('Global error:', event.error);

            if (process.env.NODE_ENV === 'development') {
                console.error('Full error details:', event);
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        window.addEventListener('error', handleError);

        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            window.removeEventListener('error', handleError);
        };
    }, []);

    // ========================================
    // APP RENDER
    // ========================================
    return (
        <ErrorBoundary>
            <AuthProvider>
                <div className="App">
                    <Router />

                    {/* Toast Notifications */}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                            },
                            success: {
                                duration: 3000,
                                iconTheme: {
                                    primary: '#4ade80',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                duration: 5000,
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />

                    {/* Development Tools */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="fixed bottom-4 left-4 bg-gray-800 text-white text-xs p-2 rounded-lg opacity-75 z-50">
                            <div>Environment: {process.env.NODE_ENV}</div>
                            <div>API: {process.env.REACT_APP_API_URL || 'localhost:5000'}</div>
                            <div className="text-gray-400 mt-1">
                                Navigation: Alt + 1-10 (pages), Alt + B (back)
                            </div>
                        </div>
                    )}
                </div>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;