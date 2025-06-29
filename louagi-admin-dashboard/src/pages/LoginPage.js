// src/pages/LoginPage.js - Clean Refactored Version
import React from 'react';
import { useLoginForm } from '../hooks/useLoginForm';
import { LoginHeader, LoginForm, LoginFooter } from '../components/login';

const LoginPage = () => {
    const {
        email,
        password,
        showPassword,
        error,
        isLoading,
        setEmail,
        setPassword,
        setShowPassword,
        handleSubmit
    } = useLoginForm();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <LoginHeader />

                {/* Login Form */}
                <LoginForm
                    email={email}
                    password={password}
                    showPassword={showPassword}
                    error={error}
                    isLoading={isLoading}
                    setEmail={setEmail}
                    setPassword={setPassword}
                    setShowPassword={setShowPassword}
                    onSubmit={handleSubmit}
                />

                {/* Footer */}
                <LoginFooter />
            </div>
        </div>
    );
};

export default LoginPage;