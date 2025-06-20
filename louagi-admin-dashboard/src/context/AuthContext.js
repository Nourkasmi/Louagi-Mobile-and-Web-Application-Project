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

    // Check if user is logged in on app start
    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');

            if (token) {
                try {
                    // Verify token with backend
                    const response = await authAPI.getCurrentUser();
                    if (response.data.success && response.data.user.role === 'admin') {
                        setUser(response.data.user);
                        setIsAuthenticated(true);
                    } else {
                        // User is not admin, remove token
                        localStorage.removeItem('token');
                    }
                } catch (error) {
                    // Token is invalid, remove it
                    localStorage.removeItem('token');
                    console.error('Token verification failed:', error);
                }
            }

            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (email, password) => {
        try {
            setLoading(true);
            const response = await authAPI.login(email, password);

            if (response.data.success) {
                const { token, user } = response.data;

                // Check if user is admin
                if (user.role !== 'admin') {
                    throw new Error('Access denied. Admin privileges required.');
                }

                // Store token and user data
                localStorage.setItem('token', token);
                setUser(user);
                setIsAuthenticated(true);

                return { success: true };
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'Login failed. Please try again.'
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Call logout API (optional, for token invalidation)
            await authAPI.logout();
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear local storage and state regardless of API call result
            localStorage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false);
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
