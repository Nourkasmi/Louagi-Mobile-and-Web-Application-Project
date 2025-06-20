import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AuthStatus = () => {
    const { user, isAuthenticated, loading } = useAuth();

    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            zIndex: 9999,
            fontFamily: 'monospace'
        }}>
            <div>🔐 Auth Status:</div>
            <div>Loading: {loading ? '✅' : '❌'}</div>
            <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
            <div>User: {user ? user.username : 'None'}</div>
            <div>Token: {localStorage.getItem('token') ? '✅' : '❌'}</div>
        </div>
    );
};

export default AuthStatus;