# Louagi Mobile 🚐

> Sustainable shared transportation platform for Tunisia

[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-50-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-2.0-purple.svg)](https://redux-toolkit.js.org/)

Louagi is a modern shared transportation platform that connects passengers with drivers for efficient, affordable, and eco-friendly travel across Tunisia. The mobile app provides seamless booking experiences for passengers and comprehensive trip management for drivers.

## 🌟 Features

### For Passengers 🎫
- **Smart Trip Search**: Find rides by departure station and destination
- **Real-time Availability**: Live updates on trip capacity and departure times
- **Secure Booking**: Book and pay for seats with mock payment integration
- **Trip History**: View past and upcoming bookings
- **Profile Management**: Update personal information and preferences
- **Environmental Impact**: Track CO₂ savings and travel statistics

### For Drivers 🚗
- **Availability Declaration**: Declare availability for specific routes and schedules
- **Trip Management**: Start, manage, and complete trips
- **Earnings Tracking**: View detailed earnings and performance analytics
- **Queue System**: Fair queue-based trip assignment
- **Real-time Updates**: Live passenger count and trip status
- **Profile & Ratings**: Manage driver profile and view ratings

### Technical Features ⚙️
- **Offline Support**: Queue requests when offline, sync when connected
- **Mock Payments**: Comprehensive payment simulation for testing
- **Real-time Sync**: 30-second auto-refresh for trip data
- **Error Handling**: Graceful error recovery and user feedback
- **Dark Mode Ready**: Theme system supporting multiple color schemes

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- React Native development environment
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio or Xcode (for emulators)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/louagi-mobile.git
   cd louagi-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment**
   ```bash
   # Update API URL in src/config/index.ts
   API_BASE_URL: 'https://your-backend-url.com/api'
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device/emulator**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app for physical device

## 📱 App Architecture

### Project Structure
```
louagi_mobile/
├── app/                          # Expo Router pages
│   ├── (driver)/                 # Driver-specific screens
│   │   ├── dashboard/            # Driver dashboard
│   │   ├── trips/               # Trip management
│   │   ├── earnings/            # Earnings analytics
│   │   └── profile/             # Driver profile
│   ├── (passenger)/             # Passenger-specific screens
│   │   ├── home/                # Passenger dashboard
│   │   ├── search/              # Trip search & booking
│   │   ├── bookings/            # Booking management
│   │   └── profile/             # Passenger profile
│   ├── login.tsx                # Authentication
│   └── _layout.tsx              # Root layout
├── src/                         # Source code
│   ├── components/              # Reusable components
│   ├── services/                # API and external services
│   ├── store/                   # Redux state management
│   ├── styles/                  # Theme system
│   └── config/                  # Configuration files
└── components/                  # App-specific components
```

### Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Redux Toolkit
- **Styling**: Custom theme system with TypeScript
- **API Client**: Axios with enhanced error handling
- **Payments**: Mock payment system (Stripe-like interface)
- **Storage**: AsyncStorage for local data
- **Icons**: MaterialIcons from Expo Vector Icons

## 🔧 Configuration

### API Configuration
```typescript
// src/config/index.ts
const Config = {
  API_BASE_URL: 'https://your-backend-url.com/api',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_...', // For real payments
  DEBUG: __DEV__,
};
```

### Payment Configuration
```typescript
// src/config/paymentConfig.ts
export const PAYMENT_MODE: 'fake' | 'mock' | 'real' = 'fake';
```

**Payment Modes:**
- `fake`: Completely simulated payments (no card validation)
- `mock`: Stripe-like interface with test cards
- `real`: Actual Stripe integration (requires valid keys)

### Theme Customization
```typescript
// src/styles/theme/colors.ts
export const colors = {
  primary: '#0066cc',      // Main brand color
  secondary: '#28a745',    // Success/secondary actions
  warning: '#ffc107',      // Warnings and alerts
  danger: '#dc3545',       // Errors and cancellations
  // ... more colors
};
```

## 🎯 User Flows

### Passenger Journey
1. **Search**: Select departure station → Choose destination → View available trips
2. **Book**: Select trip → Choose seats → Complete mock payment
3. **Track**: View booking confirmation → Track trip status → Rate experience

### Driver Journey  
1. **Declare**: Choose station → Select route → Pick schedule → Confirm availability
2. **Manage**: Monitor passenger bookings → Start trip when ready → Update status
3. **Complete**: Mark trip complete → View earnings → Check ratings

## 🧪 Testing

### Mock Payment Testing
The app includes comprehensive mock payment functionality:

**Test Cards Available:**
- `4242424242424242` - Always succeeds
- `5555555555554444` - Always succeeds
- `378282246310005` - Always declines (insufficient funds)
- `4000000000000000` - Always declines (insufficient funds)

### Test User Accounts
Create test accounts through the registration flow:
- **Passenger**: Select "Passenger" role during registration
- **Driver**: Select "Driver" role and provide license details

### API Testing
```bash
# Test API connectivity
curl -X GET https://your-backend-url.com/api/stations

# Test authentication
curl -X POST https://your-backend-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 📊 Features Deep Dive

### Real-time Trip Updates
- Auto-refresh every 30 seconds
- WebSocket support for instant updates
- Offline queue for requests when disconnected

### Payment System
- Mock Stripe integration for testing
- Support for multiple payment methods
- Automatic retry logic for failed payments
- Secure token storage

### Queue Management
- Fair first-in-first-out driver queue
- Position tracking and estimated wait times
- Automatic trip assignment when capacity reached

### Analytics & Insights
- **Passengers**: Trip history, spending analytics, environmental impact
- **Drivers**: Earnings breakdown, performance metrics, trip statistics

## 🔒 Security Features

- **Token-based Authentication**: JWT tokens with automatic refresh
- **Input Validation**: Client and server-side validation
- **Error Handling**: Graceful error recovery without exposing sensitive data
- **Offline Security**: Secure local storage with encryption

## 🌍 Internationalization

Currently supports:
- **English (Primary)**: Full app translation
- **Arabic (Planned)**: RTL support planned for future releases
- **French (Planned)**: Additional language support

## 🚀 Deployment

### Building for Production

**Android APK:**
```bash
npx expo build:android
```

**iOS IPA:**
```bash
npx expo build:ios
```

**Expo Application Services (EAS):**
```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

### Environment Variables
```bash
# .env
EXPO_PUBLIC_API_URL=https://production-api.louagi.com/api
EXPO_PUBLIC_STRIPE_KEY=pk_live_...
EXPO_PUBLIC_ENVIRONMENT=production
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Submit a Pull Request

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Follow Expo/React Native rules
- **Prettier**: Automatic code formatting
- **Naming**: Use descriptive, semantic names

## 📝 API Documentation

### Key Endpoints

**Authentication:**
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user

**Stations & Routes:**
- `GET /stations` - List all stations
- `GET /destinations` - Get destinations for station
- `GET /trips` - Search available trips

**Bookings:**
- `POST /bookings` - Create new booking
- `GET /bookings/my` - Get user's bookings
- `PATCH /bookings/:id/cancel` - Cancel booking

**Driver Operations:**
- `POST /drivers/available` - Declare availability
- `GET /drivers/status` - Get driver status
- `GET /drivers/trips` - Get driver's trips

## 🐛 Troubleshooting

### Common Issues

**1. "Network Error" on API calls**
```bash
# Check API URL configuration
# Verify backend server is running
# Test with curl/Postman
```

**2. "Metro bundler issues"**
```bash
npx expo start --clear
# or
rm -rf node_modules && npm install
```

**3. "Android build fails"**
```bash
# Clear Android build cache
cd android && ./gradlew clean
```

**4. "Payment mock not working"**
```bash
# Verify payment mode in config
# Check mock payment service initialization
```

### Debug Mode
Enable debug logging by setting `__DEV__` or check console logs:
```typescript
// Enable API logging
if (__DEV__) {
  console.log('🔄 API Request:', ...);
}
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **Documentation**: [docs.louagi.com](https://docs.louagi.com)
- **Email**: support@louagi.com
- **Discord**: [Join our community](https://discord.gg/louagi)
- **GitHub Issues**: Report bugs and feature requests

## 🎯 Roadmap

### Version 2.0 (Planned)
- [ ] Real-time chat between passengers and drivers
- [ ] Advanced route optimization with AI
- [ ] Integration with public transportation APIs
- [ ] Carbon footprint tracking and rewards
- [ ] Multi-language support (Arabic, French)

### Version 2.1 (Future)
- [ ] Voice navigation integration
- [ ] Smart pricing based on demand
- [ ] Driver social features and communities
- [ ] Corporate booking management
- [ ] Advanced analytics dashboard

## 🏆 Acknowledgments

- **Team**: Built with ❤️ by Nour Kasmi And Ahmed El Guindou
- **Community**: Thanks to all beta testers and contributors
- **Technology**: Powered by React Native, Expo, and Redux Toolkit
- **Design**: Inspired by modern mobile design principles

---

**Made with ❤️ in Tunisia 🇹🇳**

