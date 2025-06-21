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

    // ✅ REAL AUTH: Initialize authentication state
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                console.log('🔐 Initializing authentication...');

                const token = localStorage.getItem('token');

                if (!token) {
                    console.log('❌ No token found');
                    setLoading(false);
                    return;
                }

                // Verify token with backend
                console.log('🔍 Verifying token with backend...');
                const response = await authAPI.getCurrentUser();

                if (response.data.success && response.data.user) {
                    const userData = response.data.user;

                    // ✅ REAL AUTH: Strict admin validation
                    if (userData.role !== 'admin') {
                        console.warn('⚠️ Non-admin user attempting access:', userData.role);
                        localStorage.removeItem('token');
                        setUser(null);
                        setIsAuthenticated(false);
                        setLoading(false);
                        return;
                    }

                    // ✅ Check if account is active
                    if (!userData.is_active) {
                        console.warn('⚠️ Inactive admin account:', userData.email);
                        localStorage.removeItem('token');
                        setUser(null);
                        setIsAuthenticated(false);
                        setLoading(false);
                        return;
                    }

                    console.log('✅ Admin authenticated:', userData.email);
                    setUser(userData);
                    setIsAuthenticated(true);

                    // Update last login time
                    console.log('📝 Updating last login timestamp...');

                } else {
                    console.warn('❌ Invalid user response from backend');
                    localStorage.removeItem('token');
                    setUser(null);
                    setIsAuthenticated(false);
                }

            } catch (error) {
                console.error('❌ Authentication initialization failed:', error);

                // Handle different error types
                if (error.response?.status === 401) {
                    console.log('🔒 Token expired or invalid');
                } else if (error.response?.status === 403) {
                    console.log('🚫 Access forbidden');
                } else {
                    console.log('🌐 Network or server error');
                }

                // Clear invalid token
                localStorage.removeItem('token');
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    // ✅ REAL AUTH: Secure login function
    const login = async (email, password) => {
        try {
            setLoading(true);
            console.log('🔐 Attempting login for:', email);

            const response = await authAPI.login(email, password);

            if (response.data.success) {
                const { token, user: userData } = response.data;

                // ✅ REAL AUTH: Strict validation
                if (!userData || userData.role !== 'admin') {
                    console.warn('⚠️ Access denied: Not an admin user');
                    return {
                        success: false,
                        message: 'Access denied. Admin privileges required.'
                    };
                }

                if (!userData.is_active) {
                    console.warn('⚠️ Access denied: Inactive account');
                    return {
                        success: false,
                        message: 'Account is inactive. Contact system administrator.'
                    };
                }

                // ✅ SUCCESS: Store token and user data
                localStorage.setItem('token', token);
                setUser(userData);
                setIsAuthenticated(true);

                console.log('✅ Admin login successful:', userData.email);
                console.log('🎫 Token stored and user authenticated');

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

            // Handle specific error cases
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
            } else if (error.response?.status === 429) {
                return {
                    success: false,
                    message: 'Too many login attempts. Please try again later.'
                };
            } else if (!error.response) {
                return {
                    success: false,
                    message: 'Network error. Please check your connection.'
                };
            } else {
                return {
                    success: false,
                    message: 'Authentication failed. Please try again.'
                };
            }
        } finally {
            setLoading(false);
        }
    };

    // ✅ REAL AUTH: Secure logout function
    const logout = async () => {
        try {
            setLoading(true);
            console.log('🚪 Logging out admin user...');

            // Call logout API to invalidate token on server
            try {
                await authAPI.logout();
                console.log('✅ Server-side logout successful');
            } catch (error) {
                console.warn('⚠️ Server-side logout failed:', error.message);
                // Continue with local logout even if server call fails
            }

        } finally {
            // ✅ Always clear local state and storage
            localStorage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);

            console.log('✅ Local logout completed');
        }
    };

    // ✅ REAL AUTH: Check if user has specific permissions
    const hasPermission = (permission) => {
        if (!isAuthenticated || !user) return false;

        // Admin has all permissions
        if (user.role === 'admin') return true;

        // Could extend this for role-based permissions
        return false;
    };

    // ✅ REAL AUTH: Refresh user data
    const refreshUser = async () => {
        try {
            const response = await authAPI.getCurrentUser();
            if (response.data.success && response.data.user) {
                setUser(response.data.user);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to refresh user data:', error);
            return false;
        }
    };

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated,
        hasPermission,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};