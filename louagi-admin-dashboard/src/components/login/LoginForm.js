// src/components/login/LoginForm.js
import React from 'react';
import ErrorDisplay from './ErrorDisplay';
import BackendStatusInfo from './BackendStatusInfo';
import { EmailField, PasswordField } from './LoginFormFields';
import SecurityNotice from './SecurityNotice';
import SubmitButton from './SubmitButton';

const LoginForm = ({
    email,
    password,
    showPassword,
    error,
    isLoading,
    setEmail,
    setPassword,
    setShowPassword,
    onSubmit
}) => {
    return (
        <div className="bg-white rounded-lg shadow border p-8">
            <form className="space-y-6" onSubmit={onSubmit} noValidate>
                {/* Error Display */}
                <ErrorDisplay error={error} />

                {/* Backend Status Info */}
                <BackendStatusInfo />

                {/* Email Field */}
                <EmailField
                    email={email}
                    setEmail={setEmail}
                    isLoading={isLoading}
                />

                {/* Password Field */}
                <PasswordField
                    password={password}
                    setPassword={setPassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    isLoading={isLoading}
                />

                {/* Security Notice */}
                <SecurityNotice />

                {/* Submit Button */}
                <SubmitButton
                    isLoading={isLoading}
                    email={email}
                    password={password}
                />
            </form>
        </div>
    );
};

export default LoginForm;