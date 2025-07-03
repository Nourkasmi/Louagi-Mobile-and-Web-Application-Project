// src/components/layout/Sidebar.js - Updated with Destinations
import React from 'react';
import {
    BarChart3,
    Users,
    Car,
    MapPin,
    Calendar,
    CreditCard,
    Route,
    Settings,
    Clock,
    FileText,
    Navigation // ✅ NEW: Icon for destinations
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, currentRoute, setCurrentRoute }) => {
    const navigation = [
        {
            name: 'Dashboard',
            route: 'dashboard',
            icon: BarChart3
        },
        {
            name: 'Users',
            route: 'users',
            icon: Users
        },
        {
            name: 'Drivers',
            route: 'drivers',
            icon: Car
        },
        {
            name: 'Trips',
            route: 'trips',
            icon: Route
        },
        {
            name: 'Bookings',
            route: 'bookings',
            icon: FileText
        },
        {
            name: 'Stations',
            route: 'stations',
            icon: MapPin
        },
        {
            name: 'Destinations', // ✅ NEW: Added destinations menu item
            route: 'destinations',
            icon: Navigation
        },
        {
            name: 'Schedules',
            route: 'schedules',
            icon: Calendar
        },
        {
            name: 'Queue',
            route: 'queue',
            icon: Clock
        },
        {
            name: 'Payments',
            route: 'payments',
            icon: CreditCard
        },
        {
            name: 'Settings',
            route: 'settings',
            icon: Settings
        }
    ];

    const handleNavClick = (route) => {
        setCurrentRoute(route);
        onClose();
    };

    return (
        <>
            {/* Mobile sidebar overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden"
                    onClick={onClose}
                >
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
                </div>
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo */}
                <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <Car className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-xl font-bold text-white">Louagi</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="mt-8 px-4">
                    <ul className="space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentRoute === item.route;
                            return (
                                <li key={item.name}>
                                    <button
                                        onClick={() => handleNavClick(item.route)}
                                        className={`
                                            w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                                            ${isActive
                                                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }
                                        `}
                                    >
                                        <Icon className={`
                                            mr-3 h-5 w-5 
                                            ${isActive ? 'text-blue-600' : 'text-gray-400'}
                                        `} />
                                        {item.name}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 w-full p-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 text-center">
                            Louagi Admin Dashboard
                        </p>
                        <p className="text-xs text-gray-400 text-center">
                            v1.0.0
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;