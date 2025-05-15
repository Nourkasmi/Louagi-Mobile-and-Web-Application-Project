# Louagi Technical Documentation

## 1. System Architecture Overview

### 1.1 Architecture Diagram

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

### 1.2 Technology Stack

#### Frontend Technologies
- **Mobile Application**: React Native
  - State Management: Redux + Redux Toolkit
  - Navigation: React Navigation
  - UI Components: React Native Paper
  - Form Validation: Formik + Yup
  - Payment Integration: Stripe React Native SDK

- **Admin Dashboard**: React.js
  - State Management: Redux + Redux Toolkit
  - Routing: React Router
  - UI Framework: Material-UI (MUI)
  - Data Tables: react-table
  - Charts/Analytics: recharts

#### Backend Technologies
- **Server**: Node.js
- **API Framework**: Express.js
- **Authentication**: JSON Web Tokens (JWT)
- **Database ORM**: sequelize
- **Database ORM**: Sequelize 
- **API Documentation**: Swagger/OpenAPI
- **Payment Processing**: Stripe API

#### Database
- **DBMS**: PostgreSQL

## 2. Database Schema Design

### 2.1 Entity Relationship Diagram (ERD)

```
┌─────────────┐       ┌─────────────┐       ┌────────────┐
│    User     │       │   Station   │       │   Route    │
├─────────────┤       ├─────────────┤       ├────────────┤
│ id          │       │ id          │       │ id         │
│ username    │       │ name        │       │ start_id   │──┐
│ email       │       │ location    │       │ end_id     │──┘
│ password    │       │ capacity    │       │ distance   │
│ phone       │       │ is_active   │       │ base_price │
│ role        │       └──────┬──────┘       └─────┬──────┘
└──────┬──────┘              │                    │
       │                     │                    │
       │                     │                    │
┌──────┴──────┐       ┌──────┴──────┐       ┌─────┴──────┐
│   Driver    │       │  Schedule   │       │    Trip    │
├─────────────┤       ├─────────────┤       ├────────────┤
│ user_id     │       │ id          │       │ id         │
│ license_no  │───┐   │ station_id  │       │ route_id   │
│ experience  │   │   │ day_of_week │       │ schedule_id│
│ rating      │   │   │ start_time  │       │ driver_id  │
└─────────────┘   │   │ end_time    │       │ capacity   │
                  │   │ is_active   │       │ status     │
                  │   └──────┬──────┘       └─────┬──────┘
                  │          │                    │
                  │          │                    │
┌─────────────┐   │   ┌──────┴──────┐       ┌─────┴──────┐
│  Passenger  │   │   │ DriverQueue │       │  Booking   │
├─────────────┤   │   ├─────────────┤       ├────────────┤
│ user_id     │   │   │ id          │       │ id         │
│ preferences │   │   │ station_id  │       │ trip_id    │
│ payment_info│   │   │ driver_id   │◀──────│ passenger_id│
└─────────────┘   │   │ position    │       │ seats      │
                  └──▶│ schedule_id │       │ status     │
                      │ status      │       │ payment_id │
                      └─────────────┘       └────────────┘
```
## 3. API Endpoints (Entity-Based)

---

### 3.1 Auth

| Method | Endpoint              | Description        | Response         |
|--------|-----------------------|--------------------|------------------|
| POST   | `/api/auth/register`  | Register new user  | `{token, user}`  |
| POST   | `/api/auth/login`     | User login         | `{token, user}`  |
| GET    | `/api/auth/me`        | Get current user   | `{user}`         |
| POST   | `/api/auth/logout`    | User logout        | `{message}`      |

---

### 3.2 Users

| Method | Endpoint            | Description         | Response        |
|--------|---------------------|---------------------|-----------------|
| GET    | `/api/users`        | Get all users (admin only) | `[{user}]` |
| GET    | `/api/users/:id`    | Get user by ID      | `{user}`        |
| PUT    | `/api/users/:id`    | Update user         | `{user}`        |
| DELETE | `/api/users/:id`    | Delete user         | `{message}`     |

---

### 3.3 Trips

| Method | Endpoint               | Description                        | Response      |
|--------|------------------------|------------------------------------|---------------|
| GET    | `/api/trips`           | Get available trips                | `[{trip}]`    |
| GET    | `/api/trips/:id`       | Get trip details                   | `{trip}`      |
| GET    | `/api/drivers/trips`   | Get driver's trips(admin only)     | `[{trip}]`    |

---

### 3.4 Bookings

| Method | Endpoint                        | Description             | Response        |
|--------|---------------------------------|-------------------------|-----------------|
| GET    | `/api/passengers/bookings`      | Get passenger's bookings | `[{booking}]`  |
| POST   | `/api/passengers/bookings`      | Create booking          | `{booking}`     |
| DELETE | `/api/passengers/bookings/:id`  | Cancel booking          | `{message}`     |
| GET    | `/api/bookings/:id`             | Get booking details     | `{booking}`     |

---

### 3.5 Payments

| Method | Endpoint                  | Description           | Response        |
|--------|---------------------------|-----------------------|-----------------|
| POST   | `/api/payments/intent`    | Create payment intent | `{clientSecret}`|
| POST   | `/api/payments/confirm`   | Confirm payment       | `{booking}`     |

---

### 3.6 Drivers

| Method | Endpoint                        | Description               | Response                        |
|--------|---------------------------------|---------------------------|---------------------------------|
| POST   | `/api/drivers/availability`     | Declare availability      | `{queuePosition}`              |
| GET    | `/api/drivers/queue-position`   | Get current queue position| `{position, estimatedDeparture}` |

---

### 3.7 Stations

| Method | Endpoint                  | Description       | Response      |
|--------|---------------------------|-------------------|---------------|
| GET    | `/api/admin/stations`     | Get all stations  | `[{station}]` |
| POST   | `/api/admin/stations`     | Create station    | `{station}`   |
| PUT    | `/api/admin/stations/:id` | Update station    | `{station}`   |

---

### 3.8 Schedules

| Method | Endpoint                    | Description         | Response        |
|--------|-----------------------------|---------------------|-----------------|
| GET    | `/api/admin/schedules`      | Get all schedules   | `[{schedule}]`  |
| POST   | `/api/admin/schedules`      | Create schedule     | `{schedule}`    |
| PUT    | `/api/admin/schedules/:id`  | Update schedule     | `{schedule}`    |
| DELETE | `/api/admin/schedules/:id`  | Delete schedule     | `{message}`     |

---

### 3.9 Destinations

| Method | Endpoint                          | Description           | Response            |
|--------|-----------------------------------|-----------------------|---------------------|
| GET    | `/api/admin/destinations`         | Get all destinations  | `[{destinations}]`  |
| POST   | `/api/admin/destinations`         | Create destination    | `{destinations}`    |
| PUT    | `/api/admin/destinations/:id`     | Update destination    | `{destinations}`    |
| DELETE | `/api/admin/destinations/:id`     | Delete destination    | `{message}`         |

---

### 3.10 Driver Queue

| Method | Endpoint                         | Description             | Response        |
|--------|----------------------------------|-------------------------|-----------------|
| GET    | `/api/admin/driver-queue`        | Get driver queue        | `[{queueItem}]` |
| PUT    | `/api/admin/driver-queue/:id`    | Update driver in queue  | `{queueItem}`   |

## 4. Authentication and Authorization

### 4.1 Authentication Flow

1. **Registration Process**:
   - User submits registration details
   - Backend validates input data
   - Password is hashed using bcrypt
   - User record is created in the database
   - JWT token is generated and returned to the client

2. **Login Process**:
   - User submits email/password
   - Backend validates credentials
   - JWT token is generated with a 24-hour expiry
   - Both tokens are returned to the client

### 4.2 Authorization Strategy

The system implements role-based access control (RBAC) with three primary roles:

1. **Passenger Role**:
   - Can view available trips
   - Can book trips and manage their bookings
   - Can view their profile and update details

2. **Driver Role**:
   - Can declare availability for trips
   - Can view assigned trips
   - Can view their position in the driver queue
   - Can update their profile and vehicle details

3. **Admin Role**:
   - Can manage all system entities (users, stations, schedules, destenations)
   - Can view and modify the driver queue
   - Can access usage statistics and reports
   - Has full system access

### 4.3 JWT Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "uuid",
    "role": "passenger|driver|admin",
    "email": "user@example.com",
    "iat": 1620000000,
    "exp": 1620086400
  },
  "signature": "..."
}
```

## 5. Mobile Application (React Native)

### 5.1 Application Structure

```
src/
├── assets/
│   ├── images/
│   └── fonts/
├── components/
│   ├── common/
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Input.js
│   │   └── ...
│   ├── passenger/
│   │   ├── TripCard.js
│   │   ├── BookingForm.js
│   │   └── ...
│   └── driver/
│       ├── QueueStatus.js
│       ├── TripControls.js
│       └── ...
├── navigation/
│   ├── AppNavigator.js
│   ├── AuthNavigator.js
│   ├── PassengerNavigator.js
│   └── DriverNavigator.js
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   └── ...
│   ├── passenger/
│   │   ├── HomeScreen.js
│   │   ├── BookingScreen.js
│   │   ├── TripHistoryScreen.js
│   │   └── ...
│   └── driver/
│       ├── HomeScreen.js
│       ├── QueueScreen.js
│       ├── TripManagementScreen.js
│       └── ...
├── services/
│   ├── api.js
│   ├── auth.js
│   ├── trip.js
│   └── ...
├── store/
│   ├── actions/
│   ├── reducers/
│   ├── slices/
│   └── store.js
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   └── validation.js
└── App.js
```

### 5.2 Key Features - Passenger App

1. **User Authentication**
   - Login/Registration
   - Profile management
   - Password reset

2. **Trip Booking**
   - Search for trips by destanations
   - View available Times and prices
   - Book seats and make payment
   - Receive booking confirmation

3. **Booking Management**
   - View upcoming bookings
   - Cancel bookings
   - View booking history

4. **Payment Processing**
   - Secure payment via Stripe integration


### 5.3 Key Features - Driver App

1. **User Authentication**
   - Login/Registration specific to drivers
   - Driver profile management

2. **Queue Management**
   - Declare availability for specific Destanation
   - View position in the queue
   - Receive notifications for upcoming trips

3. **Trip Management**
   - View assigned trips
   - View passenger details

4. **Earnings Tracking**
   - View daily, weekly, and monthly earnings

## 6. Admin Dashboard (React.js)

### 6.1 Application Structure

```
src/
├── assets/
│   ├── images/
│   └── styles/
├── components/
│   ├── common/
│   │   ├── Navbar.js
│   │   ├── Sidebar.js
│   │   ├── DataTable.js
│   │   └── ...
│   ├── dashboard/
│   │   ├── StatsCard.js
│   │   ├── ChartComponent.js
│   │   └── ...
│   ├── stations/
│   │   ├── StationForm.js
│   │   ├── StationList.js
│   │   └── ...
│   ├── schedules/
│   ├── drivers/
│   └── routes/
├── contexts/
│   ├── AuthContext.js
│   └── ThemeContext.js
├── pages/
│   ├── auth/
│   │   ├── Login.js
│   │   └── ForgotPassword.js
│   ├── dashboard/
│   │   └── index.js
│   ├── stations/
│   │   ├── index.js
│   │   ├── create.js
│   │   ├── edit.js
│   │   └── view.js
│   ├── schedules/
│   ├── drivers/
│   ├── routes/
│   └── trips/
├── services/
│   ├── api.js
│   ├── auth.js
│   ├── station.js
│   └── ...
├── store/
│   ├── slices/
│   └── store.js
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   └── validation.js
├── App.js
└── index.js
```

### 6.2 Key Features

1. **Dashboard Overview**
   - Summary statistics (active trips, total bookings, revenue)
   - Real-time trip and booking status
   - Driver activity monitoring

2. **Station Management**
   - Create, edit, delete stations
   - View station activity and statistics

3. **Schedule Management**
   - Define working hours for each station
   - Manage operating days and hours
   - Set special schedules for holidays/events

4. **Driver Queue Management**
   - View and modify driver queue for each destenation
   - Assign drivers to trips manually if needed
   - Monitor driver performance and statistics

5. **Trip Management**
   - View all trips (scheduled, in-progress)
   - Cancel or modify trips as needed
   - View trip details including passengers

6. **User Management**
   - View and manage user accounts
   - Verify driver accounts

## 8. Frontend Implementation Details

### 8.1 Mobile Application Architecture (React Native)

The Louagi mobile application follows a component-based architecture with the following key design patterns:

- **Atomic Design Pattern**: Components are structured according to atomic design principles:
  - Atoms: Basic UI elements (buttons, inputs, etc.)
  - Molecules: Groups of atoms (form fields, search bars)
  - Organisms: Groups of molecules (booking forms, trip cards)
  - Templates: Page layouts without content
  - Pages: Templates with real content

- **Navigation Structure**:
  - Authentication Navigator: Login, registration, password reset screens
  - Passenger Navigator: Home, search, booking, history screens
  - Driver Navigator: Queue status
  - Profile Navigator: Settings, profile management screens

- **State Management**:
  - Redux store with separate slices for authentication, trips, bookings
  - Optimistic UI updates for better user experience
  - Persistent storage for offline access to critical information
  - Caching strategy for frequently accessed data

### 8.2 Key Mobile Screens and Features

#### 8.2.1 Passenger Application

1. **Authentication Screens**:
   - Login Screen: Email/password login with validation
   - Registration Screen: User registration with role selection
   - Password Reset: Password recovery flow

2. **Home Screen**:
   - Quick trip search
   - Upcoming bookings overview
   - Recent trips history

3. **Trip Search and Booking**:
   - Station selection with autocomplete
   - Date and time picker
   - Available trips listing with filtering
   - Booking confirmation

4. **Payment Processing**:
   - Credit card input with validation
   - Payment confirmation
   - Receipt generation

5. **Booking Management**:
   - View active bookings
   - Booking details screen
   - Trip history

#### 8.2.2 Driver Application

1. **Authentication and Profile**:
   - Driver-specific registration
   - Vehicle details
   - Status dashboard

2. **Queue Management**:
   - Destenation selection interface
   - Schedule selection
   - Queue position visualization
   - Estimated departure time display

3. **Trip Management**:
   - Current trip information
   - Passenger list and details
   - Trip history and earnings

### 8.3 Admin Dashboard Architecture (React.js)

The web-based administration dashboard follows modern React.js architectural patterns:

- **Component Structure**:
  - UI components using Material-UI framework
  - Reusable data presentation components
  - Layout components for consistent UI
  - Form components with validation

- **State Management**:
  - React Context API for theme and authentication state
  - Redux for complex global state
  - React Query for server state management and caching

- **Code Organization**:
  - Feature-based folder structure
  - Separation of UI components and business logic
  - Centralized API service modules
  - Reusable hooks for common functionality

### 8.4 Admin Dashboard Modules

2. **Station Management**:
   - Station CRUD operations
   - Station capacity management
   - Operating hours configuration
   - Station performance metrics

3. **Driver Queue Management**:
   - Real-time queue visualization
   - Manual queue manipulation
   - Driver assignment to trips

4. **Trip Scheduling**:
   - Schedule creation and management
   - Route configuration
   - Price management
   - Special schedule handling

5. **User Management**:
   - User account administration
   - Role assignment and permissions
   - drivers Account verification and moderation
   - User activity monitoring


## 9. Data Flow and Integration

### 9.1 Authentication Flow

1. User enters credentials in mobile app or admin dashboard
2. Frontend validates input and sends to authentication API
3. Backend verifies credentials against database
4. On success, JWT token is generated and returned
5. Frontend stores token securely (AsyncStorage for mobile, localStorage/cookies for web)
6. Token is included in Authorization header for subsequent requests

### 9.2 Booking Process Flow

1. Passenger searches for trips by selecting stations, Destenation
2. Backend queries database for matching trips with availability
3. Passenger selects desired trip and number of seats
4. Frontend creates booking with 'pending' status
5. Stripe payment intent is created with booking metadata
6. Passenger completes payment via Stripe SDK
7. Backend verifies payment success via webhook or API call
8. Booking status is updated to 'confirmed'
9. Both passenger and driver receive notifications
10. Trip's available seat count is updated

### 9.3 Driver Queue Management Flow

1. Driver declares availability for specific station and schedule
2. Backend checks current queue status and driver eligibility
3. Driver is added to queue with appropriate position
4. Queue position is continuously updated as trips depart
5. When driver reaches position 1, they are assigned to next trip
6. Driver receives notification with trip details
7. After trip completion, driver can re-enter queue if desired

### 9.4 App-to-Server Communication

- **API Communication Protocol**:
  - RESTful API design for standard operations
  - Real-time updates using WebSockets (Socket.io) for critical data
  - Polling for non-critical, time-insensitive data

- **Data Synchronization**:
  - Optimistic updates for better UX
  - Conflict resolution strategies
  - Background synchronization for offline operations
  - Retry mechanisms for failed requests

- **Error Handling**:
  - Consistent error response format
  - Client-side error recovery
  - Graceful degradation for network issues
  - User-friendly error messaging


## 10. Security Considerations

### 10.1 Authentication and Authorization

- **Secure Authentication**:
  - Password hashing with bcrypt
  - HTTPS for all communications
  - Rate limiting on auth endpoints
  - Account lockout after failed attempts

- **Token Security**:
  - Short-lived JWT tokens (24-hour expiry)
  - Secure storage practices
  - Token invalidation on logout
  - Refresh token rotation

- **Authorization Controls**:
  - Role-based access control
  - Resource-level permissions
  - Input validation on all endpoints
  - Prevention of horizontal privilege escalation

### 10.2 Data Protection

- **Sensitive Data Handling**:
  - Encryption of sensitive data at rest
  - Limited exposure of PII in responses
  - Secure transmission of payment information
  - Compliance with relevant data protection regulations

- **Input Validation**:
  - Server-side validation of all inputs
  - Protection against injection attacks
  - Request sanitization
  - Output encoding

### 10.3 Payment Security

- **Secure Payment Processing**:
  - PCI DSS compliance through Stripe
  - No storage of credit card details
  - Tokenization of payment information
  - Secure webhook handling

- **Transaction Integrity**:
  - Idempotent payment operations
  - Transaction logs
  - Refund authorization controls
  - Fraud detection measures


## 11. Testing Strategy

### 11.1 Unit Testing

- **Backend Unit Tests**:
  - Controller function testing
  - Service layer testing
  - Model validation testing
  - Test coverage targets (>80%)

- **Frontend Unit Tests**:
  - Component rendering tests
  - Hook functionality tests
  - Utility function tests
  - State management tests

### 11.2 Integration Testing

- **API Integration Tests**:
  - Endpoint functionality testing
  - Request/response validation
  - Error handling testing
  - Authentication flow testing

- **Frontend Integration Tests**:
  - Component interaction tests
  - Navigation flow tests
  - Form submission tests
  - State updates across components

### 11.3 End-to-End Testing

- **User Flow Testing**:
  - Complete booking flow
  - Driver availability to trip completion
  - Admin dashboard operations
  - Cross-role interactions

## 13. Implementation Plan

### 13.1 Week-by-Week Development Schedule

## 10-Week Project Timeline (2.5 Months)

### **Week 1: Project Setup and Planning**
- Set up Git repositorie (backend, frontend, mobile)
- Configure development environments
- Finalize technology stack
- Break down features into detailed tasks and milestones
- Set up project management tools (e.g., Jira, Trello)
- Draft initial wireframes for mobile app and admin dashboard

### **Week 2: Database and Backend Foundation**
- Design database schema (ER diagrams, relationships)
- Set up PostgreSQL (or chosen DB) with ORM (e.g., Sequelize, Prisma)
- Configure database connections and migrations
- Implement authentication system (JWT, roles, middleware)
- Create base API structure (versioning, routing, error handling)
- Set up automated testing framework (unit + integration)

### **Week 3: Core API Development I**
- Implement user management APIs (CRUD, roles)
- Develop station and destination management
- Implement trip creation and listing logic
- Begin API documentation (e.g., Swagger, Postman)


### **Week 4: Core API Development II**
- Implement booking flow (pending, confirmed, cancelled)
- Build driver availability and queue logic
- Add schedule management endpoints
- Implement basic notifications logic (placeholders or logs)

### **Week 5: Payments and Admin APIs**
- Integrate Stripe for payment intent and confirmation
- Connect payment with booking confirmation logic
- Implement admin dashboard APIs (user, trip, driver queue)
- Extend notification system (email, push structure)
- Continue API testing and refine documentation

### **Week 6: Mobile App Development – Part 1**
- Set up React Native project
- Implement login and registration flows
- Build passenger trip search and booking UI
- Create reusable UI components (buttons, forms, lists)
- Set up navigation structure and screens

### **Week 7: Mobile App Development – Part 2**
- Implement driver-specific features (trip queue, trip start/end)
- Build booking management views
- Integrate payments via Stripe SDK
- Add offline-friendly logic (local caching, queues)
- Conduct device testing (Android + iOS)

### **Week 8: Admin Dashboard Development**
- Set up React.js project for admin
- Implement authentication and role-based access
- Build user, station, and schedule management pages
- Visualize driver queue in real-time
- Implement trip, booking, and analytics dashboards

### **Week 9: Integration and Testing**
- Conduct end-to-end testing across all platforms
- Handle edge cases and error states
- QA pass across mobile and web apps
- Gather early feedback from testers

### **Week 10: Finalization and Deployment**
- Fix critical bugs and polish UX/UI
- Complete project documentation (README, API docs, setup guides)

### 13.2 Resource Allocation

- **Backend Development**: Team member 1 (primary) with support from team member 2
- **Frontend - Mobile**: Both team members collaborating with clearly defined responsibilities
- **Frontend - Admin**: Team member 2 (primary) with support from team member 1
- **Testing**: Shared responsibility with cross-testing of each other's work
- **Documentation**: Collaborative effort with regular review sessions


## 14. Future Enhancements

### 14.1 Feature Roadmap

- **Phase 2 Features**:
  - GPS tracking and real-time trip monitoring
  - In-app messaging between passengers and drivers
  - Rating and review system
  - Multi-language support
  - Advanced analytics and reporting

- **Technical Enhancements**:
  - Migration to GraphQL for more efficient data fetching
  - Implementation of microservices architecture
  - Machine learning for trip demand prediction
  - Progressive Web App version of passenger application
  - Native app optimization
