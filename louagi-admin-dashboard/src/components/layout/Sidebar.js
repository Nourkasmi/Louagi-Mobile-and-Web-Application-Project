import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
    FileText
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();

    const navigation = [
        {
            name: 'Dashboard',
            href: '/',
            icon: BarChart3,
            current: location.pathname === '/'
        },
        {
            name: 'Users',
            href: '/users',
            icon: Users,
            current: location.pathname.startsWith('/users')
        },
        {
            name: 'Drivers',
            href: '/drivers',
            icon: Car,
            current: location.pathname.startsWith('/drivers')
        },
        {
            name: 'Trips',
            href: '/trips',
            icon: Route,
            current: location.pathname.startsWith('/trips')
        },
        {
            name: 'Bookings',
            href: '/bookings',
            icon: FileText,
            current: location.pathname.startsWith('/bookings')
        },
        {
            name: 'Stations',
            href: '/stations',
            icon: MapPin,
            current: location.pathname.startsWith('/stations')
        },
        {
            name: 'Destinations',
            href: '/destinations',
            icon: Route,
            current: location.pathname.startsWith('/destinations')
        },
        {
            name: 'Schedules',
            href: '/schedules',
            icon: Calendar,
            current: location.pathname.startsWith('/schedules')
        },
        {
            name: 'Queue',
            href: '/queue',
            icon: Clock,
            current: location.pathname.startsWith('/queue')
        },
        {
            name: 'Payments',
            href: '/payments',
            icon: CreditCard,
            current: location.pathname.startsWith('/payments')
        },
        {
            name: 'Settings',
            href: '/settings',
            icon: Settings,
            current: location.pathname.startsWith('/settings')
        }
    ];

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
                <div className="flex items-center justify-center h-16 px-4 bg-primary-600">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <Car className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="text-xl font-bold text-white">Louagi</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="mt-8 px-4">
                    <ul className="space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        onClick={onClose}
                                        className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                      ${item.current
                                                ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }
                    `}
                                    >
                                        <Icon className={`
                      mr-3 h-5 w-5 
                      ${item.current ? 'text-primary-600' : 'text-gray-400'}
                    `} />
                                        {item.name}
                                    </Link>
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