# Louagi Technical Documentation

## 1. System Architecture Overview

### 1.1 Architecture Diagram

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  Mobile App       │     │  Backend Server   │     │  Admin Dashboard  │
│  (React Native)   │◄────►  (Node.js/Express)│◄────►  (React.js)       │
│                   │     │                   │     │                   │
└───────────────────┘     └─────────┬─────────┘     └───────────────────┘
                                    │
                                    │
                          ┌─────────▼─────────┐
                          │                   │
                          │  Database         │
                          │  (PostgreSQL)     │
                          │                   │
                          └───────────────────┘
```

### 1.2 Component Overview

The Louagi system consists of four main components:

1. **Mobile Application (React Native)**
   - Passenger interface for booking trips
   - Driver interface for managing trips and availability
   - Cross-platform compatibility (iOS and Android)

2. **Admin Dashboard (React.js)**
   - Web interface for station administrators
   - Management of driver schedules and station operations
   - Reporting and monitoring capabilities

3. **Backend Server (Node.js/Express)**
   - RESTful API endpoints
   - Business logic implementation
   - Authentication and authorization
   - Database communication

4. **Database (PostgreSQL)**
   - Relational data storage
   - Data integrity and relationships
   - Transaction support

## 2. Database Schema

### 2.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Users     │       │   Trips     │       │  Stations   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ username    │       │ origin_id   ├───────┤ name        │
│ email       │       │ dest_id     │       │ location    │
│ password    │       │ departure   │       │ city        │
│ role        │◄──────┤ driver_id   │       │ status      │
│ phone       │       │ status      │       └─────────────┘
│ created_at  │       │ created_at  │             ▲
└─────────────┘       │ seats       │             │
       ▲              └─────────────┘             │
       │                     ▲                    │
       │                     │                    │
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Drivers    │       │  Bookings   │       │ StationAdmin│
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ user_id     │       │ trip_id     │       │ user_id     │
│ license     │       │ passenger_id│       │ station_id  │
│ status      │       │ seats       │       │ permissions │
│ station_id  │◄──────┤ payment_id  │       └─────────────┘
│ rating      │       │ status      │
└─────────────┘       └─────────────┘
```

### 2.2 Table Definitions

#### 2.2.1 Users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role ENUM('passenger', 'driver', 'admin') NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2.2 Drivers
```sql
CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  license VARCHAR(50) NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  vehicle_capacity INTEGER NOT NULL,
  vehicle_registration VARCHAR(50) NOT NULL,
  station_id INTEGER REFERENCES stations(id),
  status ENUM('available', 'on_trip', 'offline') DEFAULT 'offline',
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2.3 Stations
```sql
CREATE TABLE stations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  status ENUM('active', 'inactive') DEFAULT 'active',
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2.4 Station_Admins
```sql
CREATE TABLE station_admins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  station_id INTEGER REFERENCES stations(id),
  permissions JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2.5 Trips
```sql
CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  origin_id INTEGER REFERENCES stations(id),
  destination_id INTEGER REFERENCES stations(id),
  departure_time TIMESTAMP NOT NULL,
  driver_id INTEGER REFERENCES drivers(id),
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  available_seats INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2.6 Bookings
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id),
  passenger_id INTEGER REFERENCES users(id),
  seats INTEGER NOT NULL,
  payment_id VARCHAR(255),
  status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2.7 Payments
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  amount DECIMAL(10,2) NOT NULL,
  transaction_id VARCHAR(255),
  payment_method VARCHAR(50) NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. API Endpoints

### 3.1 Authentication APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| POST | `/api/auth/register` | Register new user | `{username, email, password, phone, role}` | `{token, user}` |
| POST | `/api/auth/login` | User login | `{email, password}` | `{token, user}` |
| GET | `/api/auth/me` | Get current user | - | `{user}` |
| POST | `/api/auth/logout` | User logout | - | `{message}` |
| POST | `/api/auth/refresh` | Refresh token | `{refreshToken}` | `{token}` |

### 3.2 User Management APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/api/users` | Get all users (admin only) | - | `[{user}]` |
| GET | `/api/users/:id` | Get user by ID | - | `{user}` |
| PUT | `/api/users/:id` | Update user | `{userData}` | `{user}` |
| DELETE | `/api/users/:id` | Delete user | - | `{message}` |

### 3.3 Passenger APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/api/passengers/bookings` | Get passenger's bookings | - | `[{booking}]` |
| POST | `/api/passengers/bookings` | Create booking | `{tripId, seats}` | `{booking}` |
| PUT | `/api/passengers/bookings/:id` | Update booking | `{bookingData}` | `{booking}` |
| DELETE | `/api/passengers/bookings/:id` | Cancel booking | - | `{message}` |

### 3.4 Driver APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/api/drivers/trips` | Get driver's trips | - | `[{trip}]` |
| POST | `/api/drivers/availability` | Declare availability | `{stationId, scheduleId}` | `{queuePosition}` |
| PUT | `/api/drivers/trips/:id/status` | Update trip status | `{status}` | `{trip}` |
| GET | `/api/drivers/queue-position` | Get current queue position | - | `{position, estimatedDeparture}` |

### 3.5 Admin APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/api/admin/stations` | Get all stations | - | `[{station}]` |
| POST | `/api/admin/stations` | Create station | `{stationData}` | `{station}` |
| PUT | `/api/admin/stations/:id` | Update station | `{stationData}` | `{station}` |
| DELETE | `/api/admin/stations/:id` | Delete station | - | `{message}` |
| GET | `/api/admin/schedules` | Get all schedules | - | `[{schedule}]` |
| POST | `/api/admin/schedules` | Create schedule | `{scheduleData}` | `{schedule}` |
| PUT | `/api/admin/schedules/:id` | Update schedule | `{scheduleData}` | `{schedule}` |
| DELETE | `/api/admin/schedules/:id` | Delete schedule | - | `{message}` |
| GET | `/api/admin/routes` | Get all routes | - | `[{route}]` |
| POST | `/api/admin/routes` | Create route | `{routeData}` | `{route}` |
| PUT | `/api/admin/routes/:id` | Update route | `{routeData}` | `{route}` |
| DELETE | `/api/admin/routes/:id` | Delete route | - | `{message}` |
| GET | `/api/admin/driver-queue` | Get driver queue | - | `[{queueItem}]` |
| PUT | `/api/admin/driver-queue/:id` | Update driver in queue | `{position, status}` | `{queueItem}` |

### 3.6 Trip and Booking APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/api/trips` | Get available trips | `{startStationId, endStationId, date}` | `[{trip}]` |
| GET | `/api/trips/:id` | Get trip details | - | `{trip}` |
| POST | `/api/trips` | Create trip (admin only) | `{tripData}` | `{trip}` |
| PUT | `/api/trips/:id` | Update trip | `{tripData}` | `{trip}` |
| GET | `/api/bookings/:id` | Get booking details | - | `{booking}` |
| PUT | `/api/bookings/:id/status` | Update booking status | `{status}` | `{booking}` |

### 3.7 Payment APIs

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| POST | `/api/payments/intent` | Create payment intent | `{bookingId, amount}` | `{clientSecret}` |
| POST | `/api/payments/confirm` | Confirm payment | `{paymentIntentId, bookingId}` | `{booking}` |


## 4. Authentication and Authorization

### 4.1 JWT Authentication Flow

1. **Registration/Login**:
   - User provides credentials
   - Server validates credentials
   - Server generates JWT token
   - Token is returned to client

2. **Authenticated Requests**:
   - Client includes JWT in Authorization header
   - Server validates token signature
   - Server extracts user information
   - Server checks role permissions

3. **Token Structure**:
   ```
   {
     "header": {
       "alg": "HS256",
       "typ": "JWT"
     },
     "payload": {
       "id": "user_id",
       "email": "user_email",
       "role": "user_role",
       "iat": "issued_at_timestamp",
       "exp": "expiration_timestamp"
     },
     "signature": "HMACSHA256(base64UrlEncode(header) + '.' + base64UrlEncode(payload), secret)"
   }
   ```

### 4.2 Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Passenger** | - Book trips<br>- View own bookings<br>- View trip schedules<br>- Update own profile |
| **Driver** | - View assigned trips<br>- Update trip status<br>- Update availability<br>- View queue position |
| **Admin** | - Manage station settings<br>- View all trips at station<br>- Manage driver queue<br>- Generate reports |

## 5. Frontend Technical Specifications

### 5.1 Mobile Application (React Native)

#### 5.1.1 Component Structure

```
src/
├── assets/
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
│       ├── TripList.js
│       ├── StatusToggle.js
│       └── ...
├── screens/
│   ├── auth/
│   │   ├── Login.js
│   │   ├── Register.js
│   │   └── ...
│   ├── passenger/
│   │   ├── Home.js
│   │   ├── BookTrip.js
│   │   ├── MyBookings.js
│   │   └── ...
│   └── driver/
│       ├── Home.js
│       ├── TripDetails.js
│       ├── Queue.js
│       └── ...
├── navigation/
│   ├── AppNavigator.js
│   ├── AuthNavigator.js
│   ├── PassengerNavigator.js
│   └── DriverNavigator.js
├── services/
│   ├── api.js
│   ├── auth.js
│   ├── trips.js
│   └── ...
├── store/
│   ├── actions/
│   ├── reducers/
│   └── index.js
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   └── ...
└── App.js
```

#### 5.1.2 State Management

- **Redux or Context API**: For global state management
- **AsyncStorage**: For local persistent storage of user data and token

#### 5.1.3 UI/UX Libraries

- **React Native Paper**: Material design components
- **React Native Vector Icons**: Icon library
- **React Navigation**: Navigation between screens
- **React Native Gesture Handler**: Advanced touch interactions

### 5.2 Admin Dashboard (React.js)

#### 5.2.1 Component Structure

```
src/
├── assets/
├── components/
│   ├── common/
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Table.js
│   │   └── ...
│   ├── dashboard/
│   │   ├── StatsCard.js
│   │   ├── Chart.js
│   │   └── ...
│   └── station/
│       ├── DriverQueue.js
│       ├── TripSchedule.js
│       └── ...
├── pages/
│   ├── auth/
│   │   ├── Login.js
│   │   └── ...
│   ├── dashboard/
│   │   ├── Home.js
│   │   ├── Drivers.js
│   │   ├── Trips.js
│   │   └── ...
│   └── settings/
│       ├── Station.js
│       ├── Users.js
│       └── ...
├── services/
│   ├── api.js
│   ├── auth.js
│   ├── trips.js
│   └── ...
├── store/
│   ├── actions/
│   ├── reducers/
│   └── index.js
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   └── ...
└── App.js
```

#### 5.2.2 State Management

- **Redux Toolkit**: For global state management
- **React Query**: For server state management and caching

#### 5.2.3 UI/UX Libraries

- **Material-UI**: Component library
- **Chart.js/Recharts**: Data visualization
- **React Router**: Routing
- **Formik & Yup**: Form handling and validation

## 6. Backend Technical Specifications

### 6.1 Project Structure

```
src/
├── config/
│   ├── database.js
│   ├── server.js
│   └── ...
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── stationController.js
│   ├── tripController.js
│   ├── bookingController.js
│   └── ...
├── middleware/
│   ├── auth.js
│   ├── validation.js
│   ├── error.js
│   └── ...
├── models/
│   ├── User.js
│   ├── Driver.js
│   ├── Station.js
│   ├── Trip.js
│   ├── Booking.js
│   └── ...
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── stations.js
│   ├── trips.js
│   ├── bookings.js
│   └── ...
├── services/
│   ├── authService.js
│   ├── bookingService.js
│   ├── paymentService.js
│   └── ...
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   └── ...
└── server.js
```

### 6.2 Technologies and Libraries

- **Express.js**: Web framework
- **Prisma**: ORM for database operations
- **Joi**: Request validation
- **Winston**: Logging
- **Multer**: File upload handling
- **Nodemailer**: Email services
- **Jest**: Testing framework

### 6.3 Business Logic Implementation

#### 6.3.1 Booking Process

1. User searches for trips based on origin, destination, and date
2. User selects a trip and specifies number of seats
3. System checks seat availability
4. User proceeds to payment
5. On successful payment, booking is confirmed
6. System updates trip availability

#### 6.3.2 Driver Queue Management

1. Driver declares availability at a station
2. System adds driver to station queue based on fairness algorithm
3. When passengers book trips, system assigns trips to drivers in queue order
4. On trip completion, driver can rejoin queue

#### 6.3.3 Payment Processing

1. System generates payment request
2. User completes payment through integrated gateway
3. Payment gateway sends webhook notification
4. System updates booking status based on payment result

## 7. Security Considerations

### 7.1 Authentication Security

- **Password Hashing**: Using bcrypt with appropriate salt rounds
- **Token Management**: Short-lived JWT tokens with refresh token strategy
- **Rate Limiting**: To prevent brute force attacks
- **Input Validation**: To prevent injection attacks

### 7.2 API Security

- **HTTPS**: All communications encrypted with TLS
- **CORS**: Properly configured for allowed origins
- **Helmet.js**: HTTP headers security
- **Request Validation**: All inputs validated before processing

### 7.3 Data Security

- **Database Encryption**: Sensitive data encrypted at rest
- **Data Access Control**: Row-level security in database
- **Audit Logging**: All critical operations logged for tracking

## 8. Testing Strategy

### 8.1 Backend Testing

- **Unit Tests**: For individual functions and controllers
- **Integration Tests**: For API endpoints and service interactions
- **Performance Tests**: For high-load operations

### 8.2 Frontend Testing

- **Component Tests**: For UI components
- **End-to-End Tests**: For critical user flows
- **Accessibility Tests**: To ensure inclusivity

### 8.3 Test Coverage Targets

- **Backend**: Minimum 80% code coverage
- **Frontend**: Minimum 70% code coverage
- **Critical Paths**: 100% test coverage

## 9. Deployment Architecture

### 9.1 Production Environment

```
┌────────────────┐   ┌────────────────┐   ┌────────────────┐
│                │   │                │   │                │
│  Load Balancer │   │  API Server    │   │  Database      │
│  (NGINX)       ├───►  (Node.js)     ├───►  (PostgreSQL)  │
│                │   │  Containers    │   │                │
└────────────────┘   └────────────────┘   └────────────────┘
        │                    │                    │
        │                    │                    │
┌────────────────┐   ┌────────────────┐   ┌────────────────┐
│                │   │                │   │                │
│  CDN           │   │  Redis Cache   │   │  File Storage  │
│  (Frontend)    │   │                │   │                │
│                │   │                │   │                │
└────────────────┘   └────────────────┘   └────────────────┘
```

### 9.2 CI/CD Pipeline

- **Source Control**: GitHub with branch protection rules
- **CI**: Automated testing on pull requests with GitHub Actions
- **CD**: Automated deployment to staging/production environments
- **Monitoring**: Application and infrastructure monitoring with alerts

## 10. Development Roadmap

### 10.1 Week-by-Week Implementation Plan

| Week | Backend Tasks | Frontend Tasks |
|------|---------------|----------------|
| 1 | - Project setup<br>- Environment configuration<br>- Database schema design | - Project setup<br>- Component library setup<br>- Navigation structure |
| 2 | - Database migrations<br>- User authentication<br>- Base API structure | - Auth screens<br>- API integration setup<br>- Basic UI components |
| 3 | - Station & driver APIs<br>- Trip management APIs<br>- Queue logic | - Passenger home screen<br>- Trip search functionality<br>- Driver home screen |
| 4 | - Booking system<br>- Payment integration<br>- Initial testing | - Booking flow<br>- Payment integration<br>- Driver trip management |
| 5 | - Admin dashboard APIs<br>- Reporting endpoints<br>- Advanced trip management | - Admin dashboard layout<br>- Station configuration screens<br>- Driver management UI |
| 6 | - Queue optimization<br>- Notifications system<br>- API refinement | - Advanced UI components<br>- Reports and analytics views<br>- Trip scheduling interface |
| 7 | - System testing<br>- Performance optimization<br>- Security hardening | - UI polishing<br>- Responsive design<br>- Loading states and error handling |
| 8 | - Bug fixes<br>- Documentation<br>- Deployment preparation | - Bug fixes<br>- Testing<br>- Final adjustments |

### 10.2 Feature Priorities

1. **Core (MVP)**
   - User authentication
   - Trip search & booking
   - Driver queue management
   - Basic admin dashboard

2. **Secondary**
   - Payment processing
   - Driver scheduling optimization
   - Advanced reporting

3. **Future Enhancements**
   - Push notifications
   - Rating system
   - Advanced analytics

## 11. Monitoring and Maintenance

### 11.1 Application Monitoring

- **Performance Metrics**: Response times, error rates, resource usage
- **Business Metrics**: Bookings per day, active users, revenue
- **Alert Thresholds**: Defined for critical metrics

### 11.2 Error Handling

- **Global Error Handler**: For consistent error responses
- **Error Logging**: Centralized error logging with context
- **Error Categorization**: For prioritization and analysis

### 11.3 Backup Strategy

- **Database Backups**: Daily full backups, hourly incrementals
- **Retention Policy**: 7 days of hourly backups, 30 days of daily backups
- **Restoration Testing**: Monthly backup restoration tests

## 12. Appendix

### 12.1 Technology Stack Summary

- **Frontend**: React Native, React.js
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **State Management**: Redux/Context API
- **ORM**: Prisma
- **Deployment**: Docker, Kubernetes (optional)

### 12.2 Glossary

- **Louage**: Tunisian intercity shared taxi system
- **Station**: Physical location where louages depart from and arrive at
- **Trip**: A single journey between two stations
- **Booking**: A passenger's reservation for a specific trip
- **Queue**: Ordered list of drivers waiting to be assigned trips
