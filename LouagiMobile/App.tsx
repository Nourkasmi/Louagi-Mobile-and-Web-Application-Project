import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Redux Store
import { store, persistor } from './src/store/store';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Passenger Screens
import PassengerHomeScreen from './src/screens/passenger/HomeScreen';
import TripsListScreen from './src/screens/passenger/TripsListScreen';
import BookingScreen from './src/screens/passenger/BookingScreen';
import PaymentScreen from './src/screens/passenger/PaymentScreen';
import BookingHistoryScreen from './src/screens/passenger/BookingHistoryScreen';
import ProfileScreen from './src/screens/passenger/ProfileScreen';

// Driver Screens
import DriverHomeScreen from './src/screens/driver/HomeScreen';
import DriverTripsScreen from './src/screens/driver/TripsScreen';
import DriverEarningsScreen from './src/screens/driver/EarningsScreen';
import DriverProfileScreen from './src/screens/driver/ProfileScreen';

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  PassengerTabs: undefined;
  DriverTabs: undefined;
  TripsList: undefined;
  Booking: { tripId: string };
  Payment: { bookingId: string };
};

export type PassengerTabParamList = {
  Home: undefined;
  Trips: undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type DriverTabParamList = {
  Home: undefined;
  Trips: undefined;
  Earnings: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const PassengerTab = createBottomTabNavigator<PassengerTabParamList>();
const DriverTab = createBottomTabNavigator<DriverTabParamList>();

// Passenger Tab Navigator
function PassengerTabs() {
  return (
    <PassengerTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Trips':
              iconName = 'directions-bus';
              break;
            case 'Bookings':
              iconName = 'receipt';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'circle';
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <PassengerTab.Screen 
        name="Home" 
        component={PassengerHomeScreen}
        options={{ title: 'Home' }}
      />
      <PassengerTab.Screen 
        name="Trips" 
        component={TripsListScreen}
        options={{ title: 'Find Trips' }}
      />
      <PassengerTab.Screen 
        name="Bookings" 
        component={BookingHistoryScreen}
        options={{ title: 'My Bookings' }}
      />
      <PassengerTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </PassengerTab.Navigator>
  );
}

// Driver Tab Navigator
function DriverTabs() {
  return (
    <DriverTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          
          switch (route.name) {
            case 'Home':
              iconName = 'dashboard';
              break;
            case 'Trips':
              iconName = 'directions-car';
              break;
            case 'Earnings':
              iconName = 'attach-money';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'circle';
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#28A745',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <DriverTab.Screen 
        name="Home" 
        component={DriverHomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <DriverTab.Screen 
        name="Trips" 
        component={DriverTripsScreen}
        options={{ title: 'My Trips' }}
      />
      <DriverTab.Screen 
        name="Earnings" 
        component={DriverEarningsScreen}
        options={{ title: 'Earnings' }}
      />
      <DriverTab.Screen 
        name="Profile" 
        component={DriverProfileScreen}
        options={{ title: 'Profile' }}
      />
    </DriverTab.Navigator>
  );
}

// Main App Component
function App(): JSX.Element {
  const [isReady, setIsReady] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role);
      }
    } catch (error) {
      console.log('Auth check error:', error);
    } finally {
      setIsReady(true);
    }
  };

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<SplashScreen />} persistor={persistor}>
        <NavigationContainer>
          <Stack.Navigator 
            screenOptions={{ headerShown: false }}
            initialRouteName={userRole ? (userRole === 'driver' ? 'DriverTabs' : 'PassengerTabs') : 'Login'}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="PassengerTabs" component={PassengerTabs} />
            <Stack.Screen name="DriverTabs" component={DriverTabs} />
            <Stack.Screen 
              name="TripsList" 
              component={TripsListScreen}
              options={{ 
                headerShown: true,
                title: 'Available Trips',
                headerBackTitleVisible: false 
              }}
            />
            <Stack.Screen 
              name="Booking" 
              component={BookingScreen}
              options={{ 
                headerShown: true,
                title: 'Book Trip',
                headerBackTitleVisible: false 
              }}
            />
            <Stack.Screen 
              name="Payment" 
              component={PaymentScreen}
              options={{ 
                headerShown: true,
                title: 'Payment',
                headerBackTitleVisible: false 
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast />
      </PersistGate>
    </Provider>
  );
}

export default App;
