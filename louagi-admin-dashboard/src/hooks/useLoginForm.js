import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const useLoginForm = () => {
    const [email, setEmail] = useState('admin@louagi.tn');
    const [password, setPassword] = useState('SecureAdmin@123');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();

    const validateForm = (email, password) => {
        if (!email || !password) {
            return 'Email and password are required';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setIsLoading(true);

        // Validation
        const validationError = validateForm(email, password);
        if (validationError) {
            setError(validationError);
            setIsLoading(false);
            return;
        }

        try {
            console.log('🔐 Authenticating:', { email, timestamp: new Date().toISOString() });

            const result = await login(email, password);

            if (!result.success) {
                setError(result.message || 'Authentication failed');
            }
            // Success: AuthContext will handle redirect
        } catch (error) {
            console.error('Authentication error:', error);
            setError('Authentication failed. Please check your credentials and ensure the backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        // Form state
        email,
        password,
        showPassword,
        error,
        isLoading,

        // Form handlers
        setEmail,
        setPassword,
        setShowPassword,
        handleSubmit
    };
};