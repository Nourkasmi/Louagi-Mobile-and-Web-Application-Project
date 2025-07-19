# 🚌 Louagi - Transportation Management System

> Comprehensive shared transportation platform for Tunisia - Connecting passengers with drivers through smart technology

[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

Louagi is a modern, full-stack transportation management system that revolutionizes shared transportation in Tunisia. The platform consists of three integrated applications: a mobile app for passengers and drivers, a comprehensive admin dashboard, and a robust backend API.

## 🌟 System Overview

### 🏗️ Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│                     │     │                      │     │                     │
│  React Native App   │────▶│   Node.js Backend    │◀───▶│    PostgreSQL DB    │
│ (Passengers/Drivers)│     │   (Express.js API)   │     │                     │
│                     │◀────│                      │     │                     │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘
                                      ▲                             
                                      │                             
                                      ▼                             
                              ┌──────────────────┐                  
                              │                  │                  
                              │   React.js Web   │                  
                              │     Dashboard    │                  
                              │    (Admin UI)    │                  
                              │                  │                  
                              └──────────────────┘                  
```

### 🎯 Key Features

**🚗 For Drivers**
- Smart queue management with time-based scheduling
- Real-time trip assignment and passenger tracking
- Comprehensive earnings analytics and reporting
- Profile management and performance metrics

**🎫 For Passengers**
- Intuitive trip search and booking system
- Secure payment processing with Stripe integration
- Real-time trip tracking and notifications
- Booking history and environmental impact tracking

**👨‍💼 For Administrators**
- Complete system oversight and management
- User, driver, and trip management interfaces
- Real-time analytics and reporting dashboards
- Station, schedule, and queue management tools

## 📦 Project Components

### 🗂️ Repository Structure

```
louagi-system/
├── louagi-backend/           # Node.js API Server
│   ├── controllers/          # Business logic controllers
│   ├── models/              # Database models (Sequelize)
│   ├── routes/              # API route definitions
│   ├── middlewares/         # Custom middleware functions
│   ├── services/            # External service integrations
│   └── utils/               # Helper functions and utilities
├── louagi-admin-dashboard/   # React.js Admin Web App
│   ├── src/components/      # Reusable UI components
│   ├── src/pages/          # Page components
│   ├── src/hooks/          # Custom React hooks
│   ├── src/services/       # API service modules
│   └── src/context/        # React context providers
├── louagi_mobile/           # React Native Mobile App
│   ├── app/                # Expo Router pages
│   ├── src/components/     # Shared components
│   ├── src/services/       # API and external services
│   ├── src/store/         # Redux state management
│   └── src/styles/        # Theme system
└── docs/                   # Documentation and guides
```

## 🚀 Quick Start Guide

### Prerequisites

Before setting up any component, ensure you have:

- **Node.js** 16.0.0 or higher
- **PostgreSQL** 12+ database server
- **npm** or **yarn** package manager
- **Git** for version control

**For Mobile Development:**
- **Expo CLI**: `npm install -g @expo/cli`
- **Android Studio** (for Android emulation)
- **Xcode** (for iOS development, macOS only)

### 🗄️ 1. Database Setup

```bash
# Create PostgreSQL database
createdb louagi_db

# Create a dedicated user (optional but recommended)
psql -c "CREATE USER louagi_user WITH PASSWORD 'your_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE louagi_db TO louagi_user;"
```

### ⚙️ 2. Backend Setup

```bash
# Navigate to backend directory
cd louagi-backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database and Stripe credentials

# Run database migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

**Backend runs on:** `http://localhost:5000`

### 🌐 3. Admin Dashboard Setup

```bash
# Navigate to admin dashboard directory
cd louagi-admin-dashboard

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Update API URL: REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm start
```

**Admin Dashboard runs on:** `http://localhost:3000`

**Default Admin Credentials:**
- Email: `admin@louagi.tn`
- Password: `SecureAdmin@123`

### 📱 4. Mobile App Setup

```bash
# Navigate to mobile app directory
cd louagi_mobile

# Install dependencies
npm install

# Configure API endpoint in src/config/index.ts
# Update API_BASE_URL to point to your backend

# Start Expo development server
npx expo start

# Run on devices:
# - Press 'a' for Android emulator
# - Press 'i' for iOS simulator
# - Scan QR code with Expo Go for physical device
```

## 🔧 Configuration Guide

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=louagi_user
DB_PASSWORD=your_password
DB_NAME=louagi_db
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_public
```

#### Admin Dashboard (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_APP_NAME=Louagi Admin Dashboard
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_public
```

#### Mobile App (src/config/index.ts)
```typescript
const Config = {
  API_BASE_URL: 'http://localhost:5000/api', // Update for production
  PAYMENT_MODE: 'mock', // 'fake' | 'mock' | 'real'
  DEBUG: __DEV__,
};
```

## 🎯 Core Features Deep Dive

### 🚗 Driver Queue Management System

**Smart Time-Based Scheduling:**
- Drivers declare availability for specific stations and destinations
- Queue positions automatically calculate departure times (15-minute intervals)
- Automatic trip creation when drivers reach position #1
- End-of-day rollover maintains queue fairness

**Driver Journey:**
1. **Declare Availability** → Select station, destination, and schedule
2. **Queue Assignment** → Receive position and estimated departure time
3. **Trip Creation** → Trip automatically created at scheduled time
4. **Passenger Booking** → Real-time updates as passengers book seats
5. **Trip Execution** → Start trip (manual or auto when full)
6. **Completion** → Mark complete and re-enter queue if desired

### 🎫 Passenger Booking System

**Intelligent Trip Search:**
- Browse available stations and destinations
- Real-time availability and pricing information
- Smart filtering by time, price, and capacity

**Seamless Booking Flow:**
1. **Search** → Select departure station and destination
2. **Browse** → View available trips with real-time capacity
3. **Book** → Select seats and proceed to payment
4. **Pay** → Secure payment processing with Stripe
5. **Confirm** → Receive booking confirmation and trip details
6. **Track** → Monitor trip status and departure updates

### 💳 Payment Processing

**Stripe Integration Features:**
- Secure payment intent creation and confirmation
- Customer and payment method management
- Comprehensive webhook handling for status updates
- Automatic refund processing for cancellations
- Detailed payment history and analytics

**Payment Modes (Mobile App):**
- **Fake Mode**: Complete simulation for testing
- **Mock Mode**: Stripe-like interface with test cards
- **Real Mode**: Production Stripe integration

### 📊 Analytics & Reporting

**Real-time Dashboards:**
- System health monitoring and alerts
- Driver performance and earnings analytics
- Passenger booking patterns and trends
- Revenue tracking and financial reports
- Station utilization and capacity metrics

## 🛠️ Development Workflow

### Local Development Setup

1. **Start Backend** (Terminal 1):
   ```bash
   cd louagi-backend && npm run dev
   ```

2. **Start Admin Dashboard** (Terminal 2):
   ```bash
   cd louagi-admin-dashboard && npm start
   ```

3. **Start Mobile App** (Terminal 3):
   ```bash
   cd louagi_mobile && npx expo start
   ```

### Testing Strategy

**Backend Testing:**
```bash
cd louagi-backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

**Frontend Testing:**
```bash
cd louagi-admin-dashboard
npm test                    # React component tests
```

**Mobile Testing:**
```bash
cd louagi_mobile
npx expo start             # Test on devices/simulators
```

### Code Quality Standards

- **ESLint** configuration for consistent code style
- **Prettier** for automatic code formatting
- **TypeScript** for type safety (Mobile + Admin Dashboard)
- **Joi** validation for API input validation
- **Comprehensive error handling** across all components

## 🚀 Deployment Guide

### Production Environment Setup

#### 1. Backend Deployment

**Environment Configuration:**
```env
NODE_ENV=production
PORT=5000
DB_HOST=your-production-db-host
JWT_SECRET=your-production-jwt-secret
STRIPE_SECRET_KEY=sk_live_your-production-stripe-key
```

**Deployment Steps:**
```bash
# Production build and migration
npm run build
npm run db:migrate
npm start
```

#### 2. Admin Dashboard Deployment

**Build for Production:**
```bash
cd louagi-admin-dashboard
REACT_APP_API_URL=https://your-api-domain.com/api npm run build
```

**Deployment Options:**
- **Netlify**: Connect repository for automatic deployment
- **Vercel**: Zero-config deployment with Git integration
- **AWS S3 + CloudFront**: Static hosting with CDN

#### 3. Mobile App Deployment

**Build APK/IPA:**
```bash
cd louagi_mobile
# Android
npx expo build:android
# iOS
npx expo build:ios
```

**Expo Application Services:**
```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

### Health Monitoring

All components include health check endpoints:
- **Backend**: `GET /health`
- **Admin Dashboard**: Built-in error boundaries
- **Mobile App**: Connection status monitoring

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based authentication** with automatic token refresh
- **Role-based access control** (Admin, Driver, Passenger)
- **Password hashing** using bcrypt
- **Protected routes** and API endpoints
- **Session timeout** and automatic logout

### Data Security
- **Input validation** using Joi schemas
- **SQL injection protection** via Sequelize ORM
- **CORS configuration** for secure cross-origin requests
- **Helmet middleware** for security headers
- **Secure token storage** in mobile app

### Payment Security
- **PCI DSS compliance** through Stripe
- **No card data storage** on servers
- **Webhook signature verification**
- **Secure payment intent flow**

## 📈 Performance Optimization

### Backend Optimizations
- **Database connection pooling** for efficient resource usage
- **Indexed database queries** for fast data retrieval
- **Caching strategies** for frequently accessed data
- **Optimized SQL queries** with proper joins and filters

### Frontend Optimizations
- **Code splitting** and lazy loading
- **Memoized components** with React.memo()
- **Optimized re-renders** with useCallback/useMemo
- **Image optimization** and lazy loading

### Mobile Optimizations
- **Offline support** with request queuing
- **Real-time sync** with efficient polling
- **Optimistic UI updates** for better UX
- **Efficient state management** with Redux Toolkit

## 📊 System Monitoring

### Key Metrics Tracked
- **System Health**: API response times, error rates
- **Business Metrics**: Active trips, booking conversion rates
- **Performance**: Database query times, mobile app performance
- **Financial**: Revenue tracking, payment success rates

### Logging Strategy
- **Winston logging** in backend with structured logs
- **Request/response logging** for API monitoring
- **Error tracking** with detailed stack traces
- **Performance monitoring** for optimization insights

## 🤝 Contributing

### Development Guidelines

1. **Fork the repository** and create feature branches
2. **Follow coding standards** and linting rules
3. **Write comprehensive tests** for new features
4. **Update documentation** as needed
5. **Submit pull requests** with clear descriptions

### Commit Message Format
```
type(scope): description

feat(mobile): add passenger trip search functionality
fix(backend): resolve payment confirmation webhook issue
docs(readme): update installation instructions
```

### Issue Reporting
When reporting issues, please include:
- **Component affected** (backend/admin/mobile)
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details** (OS, Node version, etc.)

## 📞 Support & Community

### Getting Help
- **📖 Documentation**: Comprehensive guides for each component
- **🐛 GitHub Issues**: Report bugs and feature requests
- **💬 Discussions**: Community Q&A and feature discussions
- **📧 Email Support**: support@louagi.tn

### Community Guidelines
- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Contribute constructively to discussions

## 🗺️ Roadmap

### Version 2.0 (Q2 2025)
- [ ] **Real-time Communication**: Chat between passengers and drivers
- [ ] **Advanced Analytics**: AI-powered demand prediction
- [ ] **Multi-language Support**: Arabic and French localization
- [ ] **Mobile Optimization**: Enhanced offline capabilities

### Version 2.1 (Q3 2025)
- [ ] **GPS Integration**: Real-time vehicle tracking
- [ ] **Smart Pricing**: Dynamic pricing based on demand
- [ ] **Corporate Features**: Business account management
- [ ] **Environmental Tracking**: Carbon footprint analytics

### Long-term Vision
- [ ] **API Platform**: Third-party integrations
- [ ] **Mobile SDKs**: White-label solutions
- [ ] **AI Integration**: Route optimization and demand forecasting
- [ ] **IoT Integration**: Smart vehicle connectivity

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

### Team
- **Development Team**: Nour Kasmi & Ahmed El Guindou
- **Product Design**: Modern mobile-first approach
- **Architecture**: Scalable microservices-ready design

### Technology Stack
- **Backend**: Node.js, Express.js, PostgreSQL, Sequelize
- **Admin Dashboard**: React.js, Material-UI, Redux Toolkit
- **Mobile App**: React Native, Expo, Redux Toolkit
- **Payments**: Stripe API integration
- **DevOps**: Docker support, CI/CD ready

### Open Source
Built with ❤️ using open-source technologies and best practices from the React, Node.js, and mobile development communities.

---

**Louagi - Revolutionizing Transportation in Tunisia 🇹🇳**

*Making shared transportation accessible, efficient, and sustainable for everyone.*