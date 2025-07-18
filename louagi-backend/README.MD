# 🚌 Louagi - Transportation Management System Backend

A comprehensive Node.js backend API for managing shared transportation services, featuring real-time trip scheduling, driver queue management, passenger bookings, and integrated payment processing.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [System Architecture](#system-architecture)
- [Core Features](#core-features)
- [Payment Integration](#payment-integration)
- [Queue Management](#queue-management)
- [Cron Jobs](#cron-jobs)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### 🚗 Driver Management
- Driver registration and profile management
- Real-time availability declaration
- Queue position tracking with time-based scheduling
- Trip assignment and completion tracking
- Earnings calculation and reporting

### 👥 Passenger Services
- User registration and authentication
- Trip search and booking
- Real-time seat availability
- Payment processing with Stripe
- Booking history and analytics

### 🗓️ Schedule Management
- Flexible schedule creation by station and day
- Time-based trip generation
- Queue position calculations
- End-of-day rollover processing

### 💳 Payment Processing
- Stripe integration for secure payments
- Payment intent creation and confirmation
- Refund processing
- Payment method management
- Comprehensive payment tracking

### 📊 Analytics & Reporting
- Real-time system health monitoring
- Driver earnings reports
- Station statistics
- Booking analytics
- Weekly performance reports

## 🛠️ Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Payments**: Stripe API
- **Validation**: Joi
- **Logging**: Winston
- **Scheduling**: node-cron
- **Security**: Helmet, CORS, bcrypt

## 🚀 Installation

### Prerequisites
- Node.js 16.0.0 or higher
- PostgreSQL 12+
- npm or yarn package manager

### Clone Repository
```bash
git clone <repository-url>
cd louagi-backend
npm install
```

## 🔧 Environment Setup

Create a `.env` file in the root directory:

```env
# Database Configuration
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=louagi_db
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_ACCESS_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# API Configuration
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000,http://localhost:8081

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Payment Configuration
DEFAULT_CURRENCY=usd
PROCESSING_FEE_PERCENTAGE=2.9
PROCESSING_FEE_FIXED=0.30

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@louagi.com

# Logging Configuration
LOG_LEVEL=info
REQUEST_LOG_FORMAT=combined
```

## 🗄️ Database Setup

### Create Database
```bash
# Create PostgreSQL database
createdb louagi_db

# Run migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed
```

### Available Commands
```bash
npm run db:migrate        # Run all migrations
npm run db:migrate:undo   # Undo last migration
npm run db:seed          # Run all seeders
npm run db:seed:undo     # Undo all seeders
npm run db:reset         # Reset and reseed database
```

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Testing
```bash
npm test
npm run test:watch
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Routes
```http
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/me          # Get current user
PUT  /api/auth/me          # Update current user profile
```

### Driver Routes
```http
POST /api/drivers/available        # Declare availability
POST /api/drivers/declare-full     # Start trip immediately
GET  /api/drivers/status          # Get driver status
GET  /api/drivers/trips           # Get driver's trips
PATCH /api/drivers/trips/:id/complete  # Complete trip
```

### Passenger Routes
```http
POST /api/bookings                # Create booking
GET  /api/bookings/my            # Get user's bookings
PATCH /api/bookings/:id/cancel   # Cancel booking
GET  /api/bookings/reference/:ref # Get booking by reference
```

### Payment Routes
```http
POST /api/payments/intent         # Create payment intent
POST /api/payments/:id/confirm    # Confirm payment
GET  /api/payments/my            # Get payment history
POST /api/payments/:id/refund    # Process refund (admin)
```

### Trip Management
```http
GET  /api/trips                  # Get all trips
GET  /api/trips/:id              # Get trip by ID
POST /api/trips                  # Create trip (admin)
PUT  /api/trips/:id/status       # Update trip status
```

### Admin Routes
```http
GET  /api/stations               # Get all stations
POST /api/stations               # Create station
GET  /api/destinations           # Get all destinations
POST /api/destinations           # Create destination
GET  /api/schedules             # Get all schedules
POST /api/schedules             # Create schedule
```

## 🏗️ System Architecture

### Core Components

#### 1. Queue Management System
- **Time-based scheduling**: Trips are scheduled based on queue position and time calculations
- **Position tracking**: Automatic queue position management and reindexing
- **Smart trip creation**: Automatic trip generation based on demand and timing

#### 2. Trip Lifecycle
```
Driver declares availability → Queue position assigned → Trip created with timing → 
Passengers book → Trip starts (auto/manual) → Trip completes → Driver available again
```

#### 3. Payment Flow
```
Booking created → Payment intent → Payment confirmation → 
Trip completion → Revenue tracking → Driver earnings
```

## 🎯 Core Features

### Driver Queue System
- **Position-based scheduling**: Queue positions determine departure times
- **Time calculations**: Smart algorithms calculate optimal departure times
- **Auto-reindexing**: Queue positions automatically adjust when drivers leave
- **End-of-day rollover**: Drivers automatically moved to next day's schedule

### Smart Trip Management
- **Auto-start on full capacity**: Trips automatically start when fully booked
- **Manual start option**: Drivers can declare trips full and start immediately
- **Time-based departure**: Trips depart at calculated times regardless of capacity
- **Dynamic pricing**: Price adjustments based on demand and timing

### Real-time Updates
- **Live capacity tracking**: Real-time seat availability updates
- **Status synchronization**: Trip and booking status updates across system
- **Queue position updates**: Live queue position and timing updates

## 💳 Payment Integration

### Stripe Features
- **Payment Intents**: Secure payment processing
- **Customer Management**: Automatic customer creation and management
- **Payment Methods**: Saved payment method support
- **Webhooks**: Real-time payment status updates
- **Refunds**: Comprehensive refund processing

### Payment Flow
1. Passenger creates booking
2. Payment intent created with calculated amount
3. Frontend handles payment confirmation
4. Webhook updates payment status
5. Booking automatically confirmed on successful payment

## 📅 Queue Management

### Time-Based Scheduling
```javascript
// Calculate departure time based on queue position
const calculateTripTimes = (schedule, queuePosition, destination) => {
  const MINUTES_PER_POSITION = 15; // Configurable
  const queueDelayMs = (queuePosition - 1) * MINUTES_PER_POSITION * 60 * 1000;
  const departureTime = new Date(baseDepartureTime.getTime() + queueDelayMs);
  // ... arrival time calculation
}
```

### Queue Operations
- **Position assignment**: Automatic queue position assignment
- **Time calculation**: Smart departure time calculations
- **Reindexing**: Automatic position updates when queue changes
- **Rollover processing**: End-of-day queue management

## ⏰ Cron Jobs

### Scheduled Tasks
- **End-of-schedule cleanup**: 10:00 PM and 1:00 AM daily
- **Queue validation**: Every 30 minutes
- **Health checks**: Every 5 minutes
- **Weekly statistics**: Sunday 11:00 PM

### Queue Rollover Process
```javascript
// End-of-day processing
const handleEndOfScheduleDay = async () => {
  // Move waiting drivers to tomorrow's queue (front positions)
  // Maintain queue order within each station/destination
  // Clean up completed schedules
}
```

## 🧪 Testing

### Test Structure
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Run specific test files
npm test -- --grep "booking"
```

### Test Coverage
- Unit tests for core utilities
- Integration tests for API endpoints
- Database transaction testing
- Payment flow testing

## 🚀 Deployment

### Production Setup
1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   LOG_LEVEL=info
   ```

2. **Database Migration**
   ```bash
   npm run db:migrate
   ```

3. **Start Application**
   ```bash
   npm start
   ```

### Health Check Endpoint
```http
GET /health
```

Response includes:
- Server status
- Database connectivity
- Stripe configuration status
- Environment information

## 📊 Monitoring & Logging

### Winston Logging
- **Development**: Console output with colors
- **Production**: File-based logging with rotation
- **Request logging**: Morgan middleware for HTTP requests

### System Health
- **Real-time metrics**: Active trips, waiting drivers, revenue
- **Alert system**: Notifications for system issues
- **Performance tracking**: Response times and error rates

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin, driver, and passenger permissions
- **Input Validation**: Joi schema validation for all inputs
- **SQL Injection Protection**: Parameterized queries with Sequelize
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express applications

## 📈 Performance Optimization

- **Database Indexing**: Optimized indexes for frequent queries
- **Connection Pooling**: PostgreSQL connection pool management
- **Caching Strategy**: Efficient data retrieval patterns
- **Transaction Management**: Database transaction optimization

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- **ESLint**: Code linting and formatting
- **Naming Conventions**: Clear, descriptive variable and function names
- **Documentation**: Comprehensive inline documentation
- **Testing**: Test coverage for new features

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review API endpoints and examples

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

**Built with ❤️ by Nour Kasmi And Ahmed El Guindou**
