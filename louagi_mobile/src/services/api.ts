// src/services/api.ts - COMPLETE UPDATED VERSION
import store from '../store/store';
import { logout } from '../store/authSlice';
import axios, { InternalAxiosRequestConfig } from 'axios';
import Config from '../config';

// Declare global for authToken
declare global {
  // eslint-disable-next-line no-var
  var authToken: string | undefined;
}

const api = axios.create({
  baseURL: Config.API_BASE_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

// Add token to requests if present
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = global.authToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug logging in development only
    if (__DEV__) {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== TYPES ====================

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: 'passenger' | 'driver' | 'admin';
  isActive: boolean;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  user: User;
  licenseNo: string;
  licenseExpiry: string;
  experience: number;
  rating: number;
  vehicleType?: string;
  vehicleCapacity: number;
  isVerified: boolean;
  isAvailable: boolean;
  documents: Record<string, any>;
}

export interface Passenger {
  id: string;
  user: User;
  preferences: Record<string, any>;
  paymentInfo: Record<string, any>;
  stripeCustomerId?: string;
  isVerified: boolean;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  capacity: number;
  isActive: boolean;
  contactPhone?: string;
  contactEmail?: string;
  amenities: Record<string, any>;
}

export interface Destination {
  id: string;
  startId: string;
  endId: string;
  startStation: Station;
  endStation: Station;
  distance: number;
  basePrice: number;
  estimatedDuration: number;
  isActive: boolean;
  description?: string;
}

export interface Schedule {
  id: string;
  stationId: string;
  station: Station;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  maxTrips: number;
  notes?: string;
}

export interface Trip {
  id: string;
  routeId: string;
  scheduleId: string;
  driverId: string;
  queueId?: string;
  route: Destination;
  schedule: Schedule;
  driver: Driver;
  queueEntry?: DriverQueue;
  capacity: number;
  availableSeats: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  departureTime: string;
  estimatedArrivalTime: string;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  basePrice: number;
  currentPrice: number;
  notes?: string;
  bookings?: Booking[];
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  trip: Trip;
  passenger: Passenger;
  seats: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  paymentId?: string;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  amount: number;
  bookingReference: string;
  bookedAt: string;
  cancellationReason?: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  booking: Booking;
  parentPaymentId?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeRefundId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'disputed';
  paymentMethod: 'stripe' | 'stripe_refund' | 'cash' | 'bank_transfer';
  paidAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  failureReason?: string;
  metadata: Record<string, any>;
  processingFee?: number;
  netAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriverQueue {
  id: string;
  stationId: string;
  destinationId: string;
  driverId: string;
  scheduleId: string;
  station: Station;
  destination: Destination;
  driver: Driver;
  schedule: Schedule;
  position: number;
  status: 'waiting' | 'called' | 'skipped' | 'done' | 'assigned';
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverStatus {
  profile: Driver;
  availabilityStatus: 'available' | 'waiting_passengers' | 'on_trip' | 'in_queue';
  statusMessage: string;
  activeTrip?: Trip;
  queueEntry?: DriverQueue;
  capacityInfo?: TripCapacityStatus;
  timingInfo?: {
    departureTime: string;
    estimatedArrivalTime: string;
    formattedDeparture: string;
    formattedArrival: string;
    minutesUntilDeparture: number;
  };
  canDeclareAvailability: boolean;
  canDeclareFull: boolean;
  systemType: 'time-based';
}

export interface TripCapacityStatus {
  id: string;
  route: string;
  totalCapacity: number;
  bookedSeats: number;
  availableSeats: number;
  percentageFull: number;
  bookingsCount: number;
  status: string;
  willStartWhenFull: boolean;
  estimatedStartTime: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

// ==================== AUTH ENDPOINTS ====================

export const login = async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const updateUserProfile = async (data: { username?: string; email?: string; phone?: string }) => {
  const res = await api.put('/auth/me', data);
  return res.data;
};

export const register = async (userData: {
  username: string;
  email: string;
  password: string;
  phone: string;
  role: 'passenger' | 'driver';
  license_no?: string;
  experience?: number;
  license_expiry?: string;
  preferences?: Record<string, any>;
  payment_info?: Record<string, any>;
}): Promise<ApiResponse<{ user: User; token: string }>> => {
  const res = await api.post('/auth/register', userData);
  return res.data;
};

export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const apiLogout = async (): Promise<ApiResponse> => {
  const res = await api.post('/auth/logout');
  return res.data;
};

// ==================== STATION ENDPOINTS ====================

export const getStations = async (params?: {
  page?: number;
  limit?: number;
  city?: string;
  search?: string;
}): Promise<ApiResponse<{ stations: Station[]; total: number; totalPages: number; currentPage: number }>> => {
  const res = await api.get('/stations', { params });
  return res.data;
};

export const getStationById = async (id: string): Promise<ApiResponse<Station>> => {
  const res = await api.get(`/stations/${id}`);
  return res.data;
};

// ==================== DESTINATION ENDPOINTS ====================

export const getDestinations = async (stationId?: string, params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}): Promise<ApiResponse<{ destinations: Destination[]; total: number; totalPages: number; currentPage: number }>> => {
  const queryParams = stationId ? { startId: stationId, ...params } : params;
  const res = await api.get('/destinations', { params: queryParams });
  return res.data;
};

export const getDestinationById = async (id: string): Promise<ApiResponse<Destination>> => {
  const res = await api.get(`/destinations/${id}`);
  return res.data;
};

// ==================== SCHEDULE ENDPOINTS ====================

export async function getSchedules(stationId?: string) {
  const params: any = {};
  if (stationId) params.stationId = stationId;
  const res = await api.get('/schedules', { params });
  return res.data;
}

// ==================== TRIP ENDPOINTS ====================

export const getTrips = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  driverId?: string;
  destinationId?: string;
  search?: string;
}): Promise<ApiResponse<{ trips: Trip[]; total: number; totalPages: number; currentPage: number }>> => {
  const res = await api.get('/trips', { params });
  return res.data;
};

export const getTripById = async (id: string): Promise<ApiResponse<Trip>> => {
  const res = await api.get(`/trips/${id}`);
  return res.data;
};

export const updateTripStatus = async (id: string, status: Trip['status']): Promise<ApiResponse<Trip>> => {
  const res = await api.put(`/trips/${id}/status`, { status });
  return res.data;
};

// ==================== ENHANCED DECLARE AVAILABILITY ====================

export const declareAvailability = async (data: {
  stationId: string;
  scheduleId: string;
  destinationId: string;
}): Promise<ApiResponse<{
  trip: Trip;
  timing?: {
    queuePosition: number;
    departureTime: string;
    estimatedArrivalTime: string;
    formattedDeparture: string;
    formattedArrival: string;
    duration: string;
    queueDelayMinutes: number;
    totalDelayFromNow: number;
    scheduleStatus: string;
    isScheduleActive: boolean;
  };
  waitingForPassengers: boolean;
  availableSeats: number;
  totalCapacity: number;
  systemType: string;
  wasAutoStarted?: boolean;
  autoConfirmedBookings?: number;
}>> => {
  try {
    console.log('📡 API: Declaring availability with data:', data);

    // Validate input data
    if (!data.stationId || !data.scheduleId || !data.destinationId) {
      throw new Error('Missing required parameters: stationId, scheduleId, or destinationId');
    }

    const res = await api.post('/drivers/available', data);
    console.log('📡 API: Declare availability raw response:', res.data);

    // Handle different response structures from backend
    let normalizedResponse: ApiResponse;

    if (res.data?.success !== undefined) {
      // Backend returns { success: true, trip: {...}, timing: {...} }
      normalizedResponse = {
        success: res.data.success,
        message: res.data.message,
        data: {
          trip: res.data.trip,
          timing: res.data.timing,
          waitingForPassengers: res.data.waitingForPassengers || true,
          availableSeats: res.data.availableSeats || res.data.trip?.availableSeats || 0,
          totalCapacity: res.data.totalCapacity || res.data.trip?.capacity || 4,
          systemType: res.data.systemType || 'time-based',
          wasAutoStarted: res.data.wasAutoStarted || res.data.tripAutoStarted,
          autoConfirmedBookings: res.data.autoConfirmedBookings || 0,
        }
      };
    } else if (res.data?.trip) {
      // Backend returns { trip: {...} } without success field
      normalizedResponse = {
        success: true,
        message: 'Trip created successfully',
        data: {
          trip: res.data.trip,
          timing: res.data.timing,
          waitingForPassengers: res.data.waitingForPassengers || true,
          availableSeats: res.data.availableSeats || res.data.trip?.availableSeats || 0,
          totalCapacity: res.data.totalCapacity || res.data.trip?.capacity || 4,
          systemType: res.data.systemType || 'time-based',
          wasAutoStarted: res.data.wasAutoStarted || res.data.tripAutoStarted,
          autoConfirmedBookings: res.data.autoConfirmedBookings || 0,
        }
      };
    } else if (res.status === 201 || res.status === 200) {
      // Backend returns success status but different structure
      normalizedResponse = {
        success: true,
        message: 'Availability declared successfully',
        data: {
          trip: res.data,
          waitingForPassengers: true,
          availableSeats: res.data?.availableSeats || 4,
          totalCapacity: res.data?.capacity || 4,
          systemType: 'time-based',
        }
      };
    } else {
      // Unexpected structure
      normalizedResponse = {
        success: false,
        message: 'Unexpected response format from server',
        data: res.data
      };
    }

    console.log('📡 API: Normalized response:', normalizedResponse);
    return normalizedResponse;

  } catch (error: any) {
    console.error('❌ API: Declare availability error:', error);

    // Enhanced error handling
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      let errorMessage = 'Failed to declare availability';

      switch (status) {
        case 400:
          errorMessage = errorData?.message || 'Invalid request. Please check your selections.';
          break;
        case 401:
          errorMessage = 'Authentication required. Please log in again.';
          break;
        case 403:
          errorMessage = errorData?.message || 'You do not have permission to declare availability.';
          break;
        case 404:
          errorMessage = 'Selected station, destination, or schedule not found.';
          break;
        case 409:
          errorMessage = errorData?.message || 'You already have an active trip or are in queue.';
          break;
        case 422:
          errorMessage = errorData?.message || 'Invalid data provided. Please check your selections.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again in a moment.';
          break;
        default:
          errorMessage = errorData?.message || `Server error (${status}). Please try again.`;
      }

      return {
        success: false,
        message: errorMessage,
        error: {
          status,
          data: errorData
        }
      };
    } else if (error.request) {
      // Network error
      return {
        success: false,
        message: 'Network error. Please check your internet connection and try again.',
        error: {
          type: 'network',
          message: error.message
        }
      };
    } else {
      // Other error
      return {
        success: false,
        message: error.message || 'An unexpected error occurred. Please try again.',
        error: {
          type: 'unknown',
          message: error.message
        }
      };
    }
  }
};

// ==================== DRIVER ENDPOINTS ====================

export const getDriverStatus = async (): Promise<ApiResponse<DriverStatus>> => {
  const res = await api.get('/drivers/status');
  return res.data;
};

export const getTripCapacityStatus = async (): Promise<ApiResponse<TripCapacityStatus>> => {
  const res = await api.get('/drivers/trip-capacity');
  return res.data;
};

export const cancelWaitingTrip = async (): Promise<ApiResponse<{ cancelledTrip: { id: string; status: string } }>> => {
  const res = await api.post('/drivers/cancel-waiting-trip');
  return res.data;
};

// CLEANED getDriverTrips function
export const getDriverTrips = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<ApiResponse<{ trips: Trip[] }>> => {
  try {
    const res = await api.get('/drivers/trips', { params });

    // Handle different response structures from backend
    let normalizedResponse: ApiResponse<{ trips: Trip[] }>;

    if (res.data?.success !== undefined) {
      // Backend returns { success: true, trips: [...] }
      normalizedResponse = {
        success: res.data.success,
        message: res.data.message,
        data: { trips: res.data.trips || [] }
      };
    } else if (Array.isArray(res.data)) {
      // Backend returns trips array directly
      normalizedResponse = {
        success: true,
        data: { trips: res.data }
      };
    } else if (res.data?.trips) {
      // Backend returns { trips: [...] } without success field
      normalizedResponse = {
        success: true,
        data: { trips: res.data.trips }
      };
    } else if (res.data?.data?.trips) {
      // Backend returns { data: { trips: [...] } }
      normalizedResponse = {
        success: res.data.success || true,
        message: res.data.message,
        data: { trips: res.data.data.trips }
      };
    } else {
      // Unexpected structure
      normalizedResponse = {
        success: false,
        message: 'Unexpected response format',
        data: { trips: [] }
      };
    }

    return normalizedResponse;
  } catch (error) {
    console.error('Failed to fetch driver trips:', error);
    return {
      success: false,
      message: 'Failed to fetch driver trips',
      data: { trips: [] }
    };
  }
};

export const completeTrip = async (tripId: string): Promise<ApiResponse<Trip>> => {
  const res = await api.patch(`/drivers/trips/${tripId}/complete`);
  return res.data;
};

export const getDriverProfile = async (): Promise<ApiResponse<Driver>> => {
  const res = await api.get('/drivers/profile');
  return res.data;
};

export const getDriverEarnings = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{
  earnings: {
    totalEarnings: number;
    totalTrips: number;
    totalPassengers: number;
    averageEarningsPerTrip: number;
    averagePassengersPerTrip: number;
    period: { startDate: string; endDate: string };
  };
}>> => {
  const res = await api.get('/drivers/earnings', { params });
  return res.data;
};

export const getDriverQueue = async (): Promise<ApiResponse<{
  inQueue: boolean;
  queue?: {
    position: number;
    status: string;
    waitingTimeMinutes: number;
    estimatedDepartureTime: string;
    station: string;
    destination: string;
    schedule: string;
  };
}>> => {
  const res = await api.get('/drivers/queue');
  return res.data;
};

export const updateDriverProfile = async (data: {
  vehicleType?: string;
  vehicleCapacity?: number;
  experience?: number;
  licenseNo?: string;
  licenseExpiry?: string;
}): Promise<ApiResponse<Driver>> => {
  const res = await api.put('/drivers/profile', data);
  return res.data;
};

// ==================== BOOKING ENDPOINTS ====================

export const createBooking = async (bookingData: {
  tripId: string;
  seats?: number;
  specialRequests?: string;
}): Promise<ApiResponse<Booking>> => {
  const res = await api.post('/bookings', bookingData);
  return res.data;
};

export const getMyBookings = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{ bookings: Booking[]; summary: any }>> => {
  const res = await api.get('/bookings/my', { params });
  return res.data;
};

export const getBookingById = async (id: string): Promise<ApiResponse<Booking>> => {
  const res = await api.get(`/bookings/${id}`);
  return res.data;
};

export const getBookingByReference = async (reference: string): Promise<ApiResponse<Booking>> => {
  const res = await api.get(`/bookings/reference/${reference}`);
  return res.data;
};

export const cancelBooking = async (id: string, reason?: string): Promise<ApiResponse<Booking>> => {
  const res = await api.patch(`/bookings/${id}/cancel`, { cancellationReason: reason });
  return res.data;
};

export const updateBookingStatus = async (id: string, status: Booking['status'], reason?: string): Promise<ApiResponse<Booking>> => {
  const res = await api.patch(`/bookings/${id}/status`, { status, cancellationReason: reason });
  return res.data;
};

// ==================== PAYMENT ENDPOINTS ====================

export const createPaymentIntent = async (
  bookingId: string,
  savePaymentMethod?: boolean
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    payment: Payment;
    clientSecret: string;
  };
  clientSecret?: string; // Add this for backward compatibility
}> => {
  const res = await api.post('/payments/intent', { bookingId, savePaymentMethod });

  // Add clientSecret to root level for backward compatibility
  if (res.data.success && res.data.data?.clientSecret) {
    res.data.clientSecret = res.data.data.clientSecret;
  }

  return res.data;
};

export const confirmPayment = async (paymentId: string, paymentMethodId?: string): Promise<ApiResponse<{
  payment: Payment;
  paymentIntent: any;
}>> => {
  const res = await api.post(`/payments/${paymentId}/confirm`, { paymentMethodId });
  return res.data;
};

export const cancelPayment = async (paymentId: string, reason?: string): Promise<ApiResponse<Payment>> => {
  const res = await api.post(`/payments/${paymentId}/cancel`, { reason });
  return res.data;
};

export const getMyPayments = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<ApiResponse<{ payments: Payment[]; total: number; totalPages: number; currentPage: number }>> => {
  const res = await api.get('/payments/my', { params });
  return res.data;
};

export const getPaymentById = async (id: string): Promise<ApiResponse<Payment>> => {
  const res = await api.get(`/payments/${id}`);
  return res.data;
};

export const getSavedPaymentMethods = async (): Promise<ApiResponse<any[]>> => {
  const res = await api.get('/payments/methods');
  return res.data;
};

export const createSetupIntent = async (): Promise<ApiResponse<{
  setupIntent: { id: string; clientSecret: string };
}>> => {
  const res = await api.post('/payments/setup-intent');
  return res.data;
};

export const savePaymentMethod = async (setupIntentId: string): Promise<ApiResponse> => {
  const res = await api.post('/payments/save-method', { setupIntentId });
  return res.data;
};

// ==================== PASSENGER ANALYTICS ====================

export const getPassengerAnalytics = async (months?: number): Promise<ApiResponse<{
  analytics: {
    summary: {
      totalBookings: number;
      completedTrips: number;
      totalSpent: number;
      averageSpentPerTrip: number;
      completionRate: string;
      cancellationRate: string;
    };
    monthlyBreakdown: Array<{
      month: string;
      bookings: number;
      spent: number;
    }>;
  };
  period: string;
}>> => {
  const res = await api.get('/bookings/passenger-analytics', { params: { months } });
  return res.data;
};

// ==================== OFFLINE SUPPORT ====================

export const syncOfflineData = async (actions: any[]): Promise<ApiResponse> => {
  const res = await api.post('/sync/offline-actions', { actions });
  return res.data;
};

export const getOfflineData = async (): Promise<ApiResponse<{
  stations: Station[];
  userBookings: Booking[];
  driverTrips?: Trip[];
}>> => {
  const res = await api.get('/sync/offline-data');
  return res.data;
};

// ==================== PUSH NOTIFICATIONS ====================

export const registerPushToken = async (token: string, platform: 'ios' | 'android'): Promise<ApiResponse> => {
  const res = await api.post('/notifications/register-token', { token, platform });
  return res.data;
};

export const updateNotificationPreferences = async (preferences: {
  tripUpdates: boolean;
  bookingAlerts: boolean;
  promotions: boolean;
  sound: boolean;
  vibration: boolean;
}): Promise<ApiResponse> => {
  const res = await api.put('/notifications/preferences', preferences);
  return res.data;
};

// ==================== HELPER FUNCTIONS ====================

export const processStripePayment = async (paymentIntentId: string, paymentMethodId?: string) => {
  // This is handled by Stripe SDK directly, but keeping for compatibility
  return { success: true, paymentIntentId, paymentMethodId };
};

// ==================== ERROR HANDLING ====================

api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (__DEV__) {
      console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Enhanced error logging
    if (__DEV__) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data
      });
    }

    if (error.response?.status === 401) {
      // Clear token and dispatch Redux logout
      global.authToken = undefined;
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;