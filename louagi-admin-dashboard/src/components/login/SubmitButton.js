// src/components/login/SubmitButton.js
import React from 'react';
import { Car } from 'lucide-react';

const SubmitButton = ({ isLoading, email, password }) => {
    return (
        <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
            {isLoading ? (
                <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Authenticating...</span>
                </>
            ) : (
                <>
                    <Car className="h-4 w-4" />
                    <span>Sign In</span>
                </>
            )}
        </button>
    );
};

export default SubmitButton;