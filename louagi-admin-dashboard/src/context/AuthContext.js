import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            console.log('🔐 Initializing authentication...');

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                console.log('❌ No token found');
                setLoading(false);
                return;
            }

            console.log('🔍 Verifying token with backend...');
            const response = await authAPI.getCurrentUser();

            if (response.data.success && response.data.user) {
                const userData = response.data.user;

                // Strict admin validation
                if (userData.role !== 'admin') {
                    console.warn('⚠️ Non-admin user attempting access:', userData.role);
                    localStorage.removeItem('louagi_token');
                    setUser(null);
                    setIsAuthenticated(false);
                    setLoading(false);
                    return;
                }

                // Check if account is active
                if (!userData.isActive) {
                    console.warn('⚠️ Inactive admin account:', userData.email);
                    localStorage.removeItem('louagi_token');
                    setUser(null);
                    setIsAuthenticated(false);
                    setLoading(false);
                    return;
                }

                console.log('✅ Admin authenticated:', userData.email);
                setUser(userData);
                setIsAuthenticated(true);
            } else {
                console.warn('❌ Invalid user response from backend');
                localStorage.removeItem('louagi_token');
                setUser(null);
                setIsAuthenticated(false);
            }

        } catch (error) {
            console.error('❌ Authentication initialization failed:', error);
            localStorage.removeItem('louagi_token');
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setLoading(true);
            console.log('🔐 Attempting login for:', email);

            const response = await authAPI.login(email, password);

            if (response.data.success) {
                const { token, user: userData } = response.data;

                // Strict validation
                if (!userData || userData.role !== 'admin') {
                    console.warn('⚠️ Access denied: Not an admin user');
                    return {
                        success: false,
                        message: 'Access denied. Admin privileges required.'
                    };
                }

                if (!userData.isActive) {
                    console.warn('⚠️ Access denied: Inactive account');
                    return {
                        success: false,
                        message: 'Account is inactive. Contact system administrator.'
                    };
                }

                // SUCCESS: Store token and user data
                localStorage.setItem('louagi_token', token);
                setUser(userData);
                setIsAuthenticated(true);

                console.log('✅ Admin login successful:', userData.email);
                return { success: true };

            } else {
                console.warn('❌ Login failed:', response.data.message);
                return {
                    success: false,
                    message: response.data.message || 'Authentication failed'
                };
            }

        } catch (error) {
            console.error('❌ Login error:', error);

            if (error.response?.status === 401) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            } else if (error.response?.status === 403) {
                return {
                    success: false,
                    message: 'Access forbidden. Admin privileges required.'
                };
            } else if (!error.response) {
                return {
                    success: false,
                    message: 'Network error. Please check your connection and ensure the backend is running.'
                };
            } else {
                return {
                    success: false,
                    message: error.message || 'Authentication failed. Please try again.'
                };
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            console.log('🚪 Logging out admin user...');

            try {
                await authAPI.logout();
                console.log('✅ Server-side logout successful');
            } catch (error) {
                console.warn('⚠️ Server-side logout failed:', error.message);
            }

        } finally {
            localStorage.removeItem('louagi_token');
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            console.log('✅ Local logout completed');
        }
    };

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};