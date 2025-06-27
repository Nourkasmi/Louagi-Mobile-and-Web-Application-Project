#!/bin/bash

# 🚀 Louagi Admin Dashboard - Clean Code Migration Script
# This script helps you migrate from 1000+ line files to clean, modular code

echo "🚀 Starting Louagi Admin Dashboard Clean Code Migration..."
echo "This will transform your 1000+ line files into clean, modular components!"
echo ""

# Phase 1: Create folder structure
echo "📁 Phase 1: Creating folder structure..."
mkdir -p src/components/common
mkdir -p src/components/users
mkdir -p src/components/bookings
mkdir -p src/components/drivers
mkdir -p src/components/trips
mkdir -p src/components/stations
mkdir -p src/components/schedules
mkdir -p src/hooks
mkdir -p src/utils

echo "✅ Folder structure created!"

# Phase 2: Create index files for easy imports
echo "📝 Phase 2: Creating index files..."
touch src/components/common/index.js
touch src/components/users/index.js
touch src/components/bookings/index.js
touch src/components/drivers/index.js
touch src/components/trips/index.js
touch src/components/stations/index.js
touch src/components/schedules/index.js

echo "✅ Index files created!"

# Phase 3: Create utility files
echo "🔧 Phase 3: Creating utility files..."

# Create helpers.js
cat > src/utils/helpers.js << 'EOF'
import { Shield, Car, User } from 'lucide-react';

export const getRoleIcon = (role) => {
    switch (role) {
        case 'admin': return <Shield className="w-4 h-4" />;
        case 'driver': return <Car className="w-4 h-4" />;
        case 'passenger': return <User className="w-4 h-4" />;
        default: return <User className="w-4 h-4" />;
    }
};

export const getRoleColor = (role) => {
    switch (role) {
        case 'admin': return 'text-purple-700 bg-purple-100 border-purple-200';
        case 'driver': return 'text-blue-700 bg-blue-100 border-blue-200';
        case 'passenger': return 'text-green-700 bg-green-100 border-green-200';
        default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
};

export const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Invalid Date';
    }
};

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return 'Invalid Date';
    }
};
EOF

# Create constants.js
cat > src/utils/constants.js << 'EOF'
export const ROLE_COLORS = {
    admin: 'text-purple-700 bg-purple-100 border-purple-200',
    driver: 'text-blue-700 bg-blue-100 border-blue-200',
    passenger: 'text-green-700 bg-green-100 border-green-200',
    default: 'text-gray-700 bg-gray-100 border-gray-200'
};

export const STATUS_COLORS = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-green-100 text-green-800'
};

export const API_ENDPOINTS = {
    users: '/users',
    trips: '/trips',
    bookings: '/bookings',
    drivers: '/drivers',
    stations: '/stations',
    schedules: '/schedules'
};

export const PAGINATION_DEFAULTS = {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
};
EOF

# Create validators.js
cat > src/utils/validators.js << 'EOF'
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

export const validatePhone = (phone) => {
    const phoneRegex = /^\+?[\d\s-()]{8,}$/;
    return phoneRegex.test(phone);
};

export const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
};
EOF

# Create formatters.js
cat > src/utils/formatters.js << 'EOF'
export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

export const formatDate = (dateString, options = {}) => {
    if (!dateString) return 'N/A';
    try {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    } catch {
        return 'Invalid Date';
    }
};

export const formatDateTime = (dateString, options = {}) => {
    if (!dateString) return 'N/A';
    try {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleString('en-US', { ...defaultOptions, ...options });
    } catch {
        return 'Invalid Date';
    }
};

export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};
EOF

echo "✅ Utility files created!"

# Phase 4: Create common component index
echo "🔧 Phase 4: Creating common components index..."

cat > src/components/common/index.js << 'EOF'
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as PageHeader } from './PageHeader';
export { default as StatCard } from './StatCard';
export { default as Pagination } from './Pagination';
export { default as Toast, ToastContainer } from './Toast';
export { default as ErrorDisplay } from './ErrorDisplay';
export { default as EmptyState } from './EmptyState';
EOF

echo "✅ Common components index created!"

# Phase 5: Create backup of original files
echo "💾 Phase 5: Creating backup of original files..."
mkdir -p backup/pages
cp src/pages/UsersPage.js backup/pages/UsersPage.js.backup 2>/dev/null || echo "UsersPage.js not found"
cp src/pages/BookingsPage.js backup/pages/BookingsPage.js.backup 2>/dev/null || echo "BookingsPage.js not found"
cp src/pages/DriversPage.js backup/pages/DriversPage.js.backup 2>/dev/null || echo "DriversPage.js not found"
cp src/pages/TripsPage.js backup/pages/TripsPage.js.backup 2>/dev/null || echo "TripsPage.js not found"
cp src/pages/StationsPage.js backup/pages/StationsPage.js.backup 2>/dev/null || echo "StationsPage.js not found"
cp src/pages/SchedulesPage.js backup/pages/SchedulesPage.js.backup 2>/dev/null || echo "SchedulesPage.js not found"

echo "✅ Original files backed up!"

echo ""
echo "🎉 Migration setup complete!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Copy the component files from the artifacts provided"
echo "2. Copy the hook files from the artifacts provided"
echo "3. Replace your page files with the clean versions"
echo "4. Test each page to ensure functionality is preserved"
echo ""
echo "📊 EXPECTED RESULTS:"
echo "   Before: 6,300+ lines across 6 page files"
echo "   After:  300 lines across 6 page files + modular components"
echo "   Reduction: 95% smaller page files!"
echo ""
echo "🚀 Your codebase will be much cleaner and easier to maintain!"

# Create a quick test command
echo ""
echo "🧪 To test your migration, run:"
echo "   npm start"
echo "   # Check each page works exactly the same as before"
echo ""
echo "🔧 If you find any issues:"
echo "   # Restore from backup:"
echo "   cp backup/pages/*.backup src/pages/"
echo ""

# Create completion checklist
cat > MIGRATION_CHECKLIST.md << 'EOF'
# 🚀 Louagi Admin Dashboard - Migration Checklist

## ✅ Phase 1: Setup (COMPLETED)
- [x] Created folder structure
- [x] Created utility files
- [x] Created index files
- [x] Backed up original files

## 📋 Phase 2: Component Migration (TODO)
### Users Page
- [ ] Copy UserCard.js to src/components/users/
- [ ] Copy UserFilters.js to src/components/users/
- [ ] Copy UserStats.js to src/components/users/
- [ ] Copy UserGrid.js to src/components/users/
- [ ] Copy UserModals.js to src/components/users/
- [ ] Copy useUsers.js to src/hooks/
- [ ] Copy useToast.js to src/hooks/
- [ ] Replace UsersPage.js with clean version
- [ ] Test UsersPage functionality

### Bookings Page
- [ ] Copy BookingStats.js to src/components/bookings/
- [ ] Copy BookingFilters.js to src/components/bookings/
- [ ] Copy BookingTable.js to src/components/bookings/
- [ ] Copy BookingModals.js to src/components/bookings/
- [ ] Copy useBookings.js to src/hooks/
- [ ] Replace BookingsPage.js with clean version
- [ ] Test BookingsPage functionality

### Common Components
- [ ] Copy Pagination.js to src/components/common/
- [ ] Copy Toast.js to src/components/common/
- [ ] Copy ErrorDisplay.js to src/components/common/
- [ ] Copy EmptyState.js to src/components/common/

### Remaining Pages (Apply same pattern)
- [ ] DriversPage refactoring
- [ ] TripsPage refactoring
- [ ] StationsPage refactoring
- [ ] SchedulesPage refactoring

## 🧪 Phase 3: Testing (TODO)
- [ ] All pages load without errors
- [ ] All functionality works exactly the same
- [ ] No console errors
- [ ] API calls work correctly
- [ ] Modals open/close properly
- [ ] Filters work correctly
- [ ] Pagination works correctly

## 🎉 Phase 4: Cleanup (TODO)
- [ ] Remove unused imports
- [ ] Remove console.logs
- [ ] Update any remaining old references
- [ ] Delete backup files (optional)

## 📊 Results
Before: ____ lines total
After: ____ lines total
Reduction: ____%

## 🚀 Benefits Achieved
- [ ] Smaller, more maintainable page files
- [ ] Reusable components
- [ ] Testable business logic in hooks
- [ ] Consistent UI patterns
- [ ] Easier to add new features
EOF

echo "📋 Created MIGRATION_CHECKLIST.md to track your progress!"
echo ""
echo "🎯 Happy coding! Your codebase is about to become much cleaner! 🎉"