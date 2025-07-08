// src/components/layout/Layout.js - Updated to pass navigation props
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, currentRoute, setCurrentRoute }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={closeSidebar}
                currentRoute={currentRoute}
                setCurrentRoute={setCurrentRoute}
            />

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
                {/* Header - Updated to pass navigation props */}
                <Header 
                    onMenuClick={toggleSidebar}
                    currentRoute={currentRoute}
                    setCurrentRoute={setCurrentRoute}
                />

                {/* Page content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-4 lg:p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;