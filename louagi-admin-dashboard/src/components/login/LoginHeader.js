import React from 'react';
import { Car } from 'lucide-react';

const LoginHeader = () => {
    return (
        <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                <Car className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Louagi Admin Portal
            </h2>
            <p className="mt-2 text-sm text-gray-600">
                Transportation Management System
            </p>
        </div>
    );
};

export default LoginHeader;