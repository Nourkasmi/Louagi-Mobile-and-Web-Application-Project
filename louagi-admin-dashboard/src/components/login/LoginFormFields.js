// src/components/login/LoginFormFields.js
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const EmailField = ({ email, setEmail, isLoading }) => (
    <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Admin Email
        </label>
        <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="admin@louagi.tn"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            disabled={isLoading}
            autoFocus
        />
    </div>
);

export const PasswordField = ({ password, setPassword, showPassword, setShowPassword, isLoading }) => (
    <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
        </label>
        <div className="relative">
            <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
            />
            <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                tabIndex={-1}
            >
                {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                )}
            </button>
        </div>
    </div>
);
export default EmailField;