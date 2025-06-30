# 🚌 Louagi Admin Dashboard

A modern, responsive admin dashboard for Louagi Transportation Management System built with React. This dashboard provides comprehensive management tools for users, drivers, trips, bookings, stations, schedules, and queue management.

## 🌟 Features

### 📊 Dashboard Overview
- Real-time statistics and analytics
- Interactive charts and graphs
- Recent activity monitoring
- System status tracking
- Quick action shortcuts

### 👥 User Management
- User creation and management (Admin, Driver, Passenger)
- Role-based access control
- User status management (Active/Inactive)
- Bulk operations support
- Advanced filtering and search

### 🚗 Driver Management
- Driver verification and licensing
- Performance tracking and ratings
- Queue position monitoring
- Vehicle information management
- Experience and certification tracking

### 🎫 Bookings Management
- Booking status tracking (Pending, Confirmed, Completed, Cancelled)
- Payment status monitoring
- Trip assignment management
- Special requests handling
- Revenue analytics

### 🚌 Trip Management
- Trip scheduling and monitoring
- Route management
- Real-time status updates
- Capacity management
- Driver assignment

### 🏢 Station Management
- Station creation and configuration
- Capacity management
- Amenities tracking (WiFi, Food Court, Security, Toilets)
- Contact information management
- Utilization monitoring

### 📅 Schedule Management
- Weekly schedule configuration
- Operating hours management
- Station-specific schedules
- Active/inactive status control
- Day-of-week scheduling

### ⏳ Queue Management
- Real-time driver queue monitoring
- Position management (Move up/down)
- Status updates (Waiting, Called, Done, Skipped)
- Multi-criteria filtering
- Live queue statistics

### 💰 Payment Management
- Transaction monitoring
- Refund processing
- Payment method tracking
- Revenue analytics
- Export capabilities

## 🛠️ Technology Stack

- **Frontend**: React 19.1.0
- **Styling**: Custom CSS (No Tailwind dependency)
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **Validation**: Yup
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Notifications**: React Hot Toast
- **Routing**: React Router DOM

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on `http://localhost:5000`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd louagi-admin-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_BACKEND_URL=http://localhost:5000
   REACT_APP_APP_NAME=Louagi Admin Dashboard
   REACT_APP_COMPANY_NAME=Louagi Transportation
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Default Admin Credentials

```
Email: admin@louagi.tn
Password: SecureAdmin@123
```

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Shared components (Pagination, LoadingSpinner, etc.)
│   ├── bookings/        # Booking-specific components
│   ├── dashboard/       # Dashboard components
│   ├── drivers/         # Driver management components
│   ├── layout/          # Layout components (Header, Sidebar)
│   ├── login/           # Authentication components
│   ├── queue/           # Queue management components
│   ├── schedules/       # Schedule management components
│   ├── stations/        # Station management components
│   ├── trips/           # Trip management components
│   └── users/           # User management components
├── context/             # React contexts (AuthContext)
├── hooks/               # Custom React hooks
│   ├── useBookingsData.js
│   ├── useDashboardData.js
│   ├── useDriversData.js
│   ├── useLoginForm.js
│   ├── useQueueData.js
│   ├── useSchedulesData.js
│   ├── useStationsData.js
│   ├── useTripsData.js
│   └── useUsersData.js
├── pages/               # Page components
├── services/            # API services
├── utils/               # Utility functions
└── App.js              # Main application component
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `REACT_APP_BACKEND_URL` | Backend base URL | `http://localhost:5000` |
| `REACT_APP_APP_NAME` | Application name | `Louagi Admin Dashboard` |
| `REACT_APP_COMPANY_NAME` | Company name | `Louagi Transportation` |
| `REACT_APP_STRIPE_PUBLISHABLE_KEY` | Stripe public key | (Test key included) |

### Theme Configuration

The application uses a custom CSS system with predefined color schemes:

```env
REACT_APP_PRIMARY_COLOR=#3B82F6
REACT_APP_SECONDARY_COLOR=#6B7280
REACT_APP_SUCCESS_COLOR=#10B981
REACT_APP_ERROR_COLOR=#EF4444
REACT_APP_WARNING_COLOR=#F59E0B
```

## 🔗 API Integration

The dashboard connects to a backend API with the following endpoints:

- **Authentication**: `/auth/login`, `/auth/logout`, `/auth/me`
- **Users**: `/users` (GET, POST, PUT, DELETE)
- **Trips**: `/trips` (GET, POST, PUT, DELETE)
- **Bookings**: `/bookings` (GET, PATCH)
- **Drivers**: `/drivers` (GET, PUT)
- **Stations**: `/stations` (GET, POST, PUT, DELETE)
- **Schedules**: `/schedules` (GET, POST, PUT, DELETE)
- **Queue**: `/queues` (GET, PATCH)
- **Payments**: `/payments` (GET, POST)

## 🔐 Authentication & Security

- **JWT-based authentication**
- **Role-based access control** (Admin, Driver, Passenger)
- **Protected routes** - Only authenticated admins can access
- **Automatic token refresh**
- **Session timeout handling**
- **Secure credential validation**

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- **Desktop** (1280px+)
- **Tablet** (768px - 1024px)
- **Mobile** (320px - 768px)

## 🎨 UI/UX Features

- **Modern gradient design**
- **Smooth animations and transitions**
- **Interactive hover effects**
- **Loading states and skeletons**
- **Toast notifications**
- **Modal dialogs**
- **Drag and drop support** (planned)
- **Dark mode support** (planned)

## 📊 Data Management

- **Real-time updates**
- **Optimistic UI updates**
- **Error handling and retry logic**
- **Pagination support**
- **Advanced filtering**
- **Search functionality**
- **Export capabilities** (CSV)
- **Bulk operations**

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🏗️ Building for Production

```bash
# Create production build
npm run build

# Serve production build locally
npm install -g serve
serve -s build
```

## 🚀 Deployment

### Environment Setup

1. **Production environment variables**
   ```env
   REACT_APP_ENV=production
   REACT_APP_API_URL=https://your-api-domain.com/api
   REACT_APP_DEBUG=false
   ```

2. **Build optimization**
   ```bash
   GENERATE_SOURCEMAP=false npm run build
   ```

### Deployment Options

- **Netlify**: Connect your repository for automatic deployments
- **Vercel**: Zero-config deployment with Git integration
- **AWS S3 + CloudFront**: Static hosting with CDN
- **Docker**: Use the included Dockerfile for containerization

## 🔧 Customization

### Adding New Components

1. Create component in appropriate directory
2. Add to component index file
3. Update routing if needed
4. Add to navigation if required

### Custom Hooks

The project uses custom hooks for data management:
```javascript
const {
  data,
  loading,
  error,
  actions
} = useCustomData();
```

### Styling

The project uses custom CSS classes. Key utility classes:
- `.btn-primary`, `.btn-secondary` - Button styles
- `.card` - Card container
- `.input-field` - Form input styling
- `.loading-spinner` - Loading animation

## 📈 Performance Optimization

- **Code splitting** with React.lazy()
- **Memoized components** with React.memo()
- **Optimized re-renders** with useCallback/useMemo
- **Image optimization** and lazy loading
- **Bundle analysis** available with `REACT_APP_BUNDLE_ANALYZER=true`

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Verify backend is running on correct port
   - Check CORS configuration
   - Validate API endpoint URLs

2. **Authentication Problems**
   - Clear browser localStorage
   - Check token expiration
   - Verify admin role assignment

3. **Build Issues**
   - Clear node_modules and reinstall
   - Check for dependency conflicts
   - Verify Node.js version compatibility

### Debug Mode

Enable debug mode for additional logging:
```env
REACT_APP_DEBUG=true
REACT_APP_SHOW_DEBUG_INFO=true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Maintain responsive design principles

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Email**: support@louagi.tn
- **Documentation**: [docs.louagi.tn](https://docs.louagi.tn)
- **Issues**: Create a GitHub issue

## 🗺️ Roadmap

### Upcoming Features
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app integration
- [ ] Multi-language support
- [ ] Advanced reporting system
- [ ] GPS tracking integration
- [ ] WhatsApp/SMS notifications
- [ ] Advanced user permissions

---

**Built with ❤️ by the Louagi Team**

*Streamlining transportation management across Tunisia and beyond.*