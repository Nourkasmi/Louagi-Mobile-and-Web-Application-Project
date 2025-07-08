// src/components/layout/Header.js - Updated with Profile and Settings navigation
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Menu,
    User,
    Settings,
    LogOut,
    ChevronDown
} from 'lucide-react';

const Header = ({ onMenuClick, currentRoute, setCurrentRoute }) => {
    const { user, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleProfileClick = () => {
        setShowProfileMenu(false);
        setCurrentRoute('profile');
    };

    const handleSettingsClick = () => {
        setShowProfileMenu(false);
        setCurrentRoute('settings');
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
                {/* Left side - Mobile menu button only */}
                <div className="flex items-center">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>

                {/* Right side - Profile menu only */}
                <div className="flex items-center">
                    <div className="relative" ref={profileMenuRef}>
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center space-x-3 p-2 rounded-lg text-gray-700 hover:bg-gray-100"
                        >
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium">{user?.username || 'Admin'}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>

                        {/* Dropdown menu */}
                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>

                                <button 
                                    onClick={handleProfileClick}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                >
                                    <User className="h-4 w-4" />
                                    <span>Profile</span>
                                </button>

                                <button 
                                    onClick={handleSettingsClick}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span>Settings</span>
                                </button>

                                <hr className="my-1" />

                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Sign out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;