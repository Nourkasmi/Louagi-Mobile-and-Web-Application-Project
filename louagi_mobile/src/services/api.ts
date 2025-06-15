// src/services/api.ts - Complete Enhanced API Service
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
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
  },
});

// Add token to requests if present
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = global.authToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Types ----
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

export interface Station {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  capacity?: number;
  isActive?: boolean;
  contactPhone?: string;
  contactEmail?: string;
  amenities?: any;
}

export interface Destination {
  id: string;
  description: string;
  startStation: Station;
  endStation: Station;
  distance: number;
  basePrice: number;
  estimatedDuration: number;
  isActive?: boolean;
}

export interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  maxTrips?: number;
  notes?: string;
}

export interface Driver {
  id: string;
  user: {
    username: string;
    email?: string;
  };
  rating: number;
  vehicleType?: string;
  vehicleCapacity: number;
  isVerified?: boolean;
  isAvailable?: boolean;
  experience?: number;
  licenseNo?: string;
}

export interface Trip {
  id: string;
  route: Destination;
  schedule: Schedule;
  driver: Driver;
  departureTime: string;
  estimatedArrivalTime: string;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  basePrice: number;
  currentPrice: number;
  capacity: number;
  availableSeats: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  queueId?: string;
}

export interface Booking {
  id: string;
  tripId: string;
  seats: number;
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  bookingReference: string;
  specialRequests?: string;
  cancellationReason?: string;
  trip: Trip;
  passenger?: {
    user: {
      username: string;
      email: string;
      phone: string;
    };
  };
  createdAt: string;
  bookedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface StationsResponse {
  success: boolean;
  stations: Station[];
  total: number;
  totalPages?: number;
  currentPage?: number;
}

export interface DestinationsResponse {
  success: boolean;
  destinations: Destination[];
  total: number;
}

export interface TripsResponse {
  success: boolean;
  trips: Trip[];
  total: number;
  totalPages?: number;
  currentPage?: number;
}

export interface BookingsResponse {
  success: boolean;
  bookings: Booking[];
  total: number;
  summary?: {
    totalBookings: number;
    totalPages: number;
    currentPage: number;
    totalSpent?: number;
    upcomingTrips?: number;
    completedTrips?: number;
  };
}

export interface PaymentIntentResponse {
  success: boolean;
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    processingFee?: number;
    netAmount?: number;
  };
  clientSecret: string;
  message?: string;
}

// ---- Driver-specific Types ----
export interface DriverStatus {
  profile: {
    id: string;
    user: {
      username: string;
      email: string;
    };
    rating: number;
    vehicleType?: string;
    vehicleCapacity: number;
    isVerified: boolean;
  };
  availabilityStatus: 'available' | 'waiting_passengers' | 'on_trip' | 'in_queue';
  statusMessage: string;
  activeTrip: Trip | null;
  queueEntry: any | null;
  capacityInfo: any | null;
  canDeclareAvailability: boolean;
  systemType: string;
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

export interface DriverTrip extends Trip {
  earnings?: number;
  passengers?: any[];
  bookings?: Booking[];
}

export interface AvailabilityRequest {
  stationId: string;
  scheduleId: string;
  destinationId: string;
}

export interface DriverEarnings {
  totalEarnings: number;
  totalTrips: number;
  totalPassengers: number;
  averageEarningsPerTrip: number;
  averagePassengersPerTrip: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

// ---- Auth Endpoints ----
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
};

export const register = async (userData: Record<string, any>): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/auth/register', userData);
  return res.data;
};

export const getCurrentUser = async (): Promise<AuthResponse> => {
  const res = await api.get<AuthResponse>('/auth/me');
  return res.data;
};

export const logout = async (): Promise<ApiResponse<any>> => {
  const res = await api.post<ApiResponse<any>>('/auth/logout');
  return res.data;
};

// ---- Station Endpoints ----
export const getStations = async (params: {
  page?: number;
  limit?: number;
  city?: string;
  search?: string;
} = {}): Promise<StationsResponse> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const res = await api.get<StationsResponse>(`/stations?${queryParams.toString()}`);
  return res.data;
};

export const getStationById = async (id: string): Promise<ApiResponse<Station>> => {
  const res = await api.get<ApiResponse<Station>>(`/stations/${id}`);
  return res.data;
};

// ---- Destination Endpoints ----
export const getDestinations = async (params: {
  stationId?: string;
  startId?: string;
  endId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<DestinationsResponse> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const res = await api.get<DestinationsResponse>(`/destinations?${queryParams.toString()}`);
  return res.data;
};

export const getDestinationById = async (id: string): Promise<ApiResponse<Destination>> => {
  const res = await api.get<ApiResponse<Destination>>(`/destinations/${id}`);
  return res.data;
};

// ---- Trip Endpoints ----
export const getTrips = async (params: {
  stationId?: string;
  destinationId?: string;
  scheduleId?: string;
  driverId?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}): Promise<TripsResponse> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const res = await api.get<TripsResponse>(`/trips?${queryParams.toString()}`);
  return res.data;
};

export const getTripById = async (id: string): Promise<ApiResponse<Trip>> => {
  const res = await api.get<ApiResponse<Trip>>(`/trips/${id}`);
  return res.data;
};

// ---- Booking Endpoints ----
export const createBooking = async (bookingData: {
  tripId: string;
  seats: number;
  specialRequests?: string;
  paymentMethod?: string;
}): Promise<ApiResponse<Booking>> => {
  const res = await api.post<ApiResponse<Booking>>('/bookings', bookingData);
  return res.data;
};

export const getMyBookings = async (params: {
  status?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
} = {}): Promise<BookingsResponse> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const res = await api.get<BookingsResponse>(`/bookings/my?${queryParams.toString()}`);
  return res.data;
};

export const getAllBookings = async (params: {
  status?: string;
  tripId?: string;
  passengerId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
} = {}): Promise<BookingsResponse> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const res = await api.get<BookingsResponse>(`/bookings?${queryParams.toString()}`);
  return res.data;
};

export const getBookingById = async (id: string): Promise<ApiResponse<Booking>> => {
  const res = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
  return res.data;
};

export const getBookingByReference = async (reference: string): Promise<ApiResponse<Booking>> => {
  const res = await api.get<ApiResponse<Booking>>(`/bookings/reference/${reference}`);
  return res.data;
};

export const cancelBooking = async (id: string, reason?: string): Promise<ApiResponse<Booking>> => {
  const res = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/cancel`, {
    cancellationReason: reason
  });
  return res.data;
};

export const updateBookingStatus = async (
  id: string, 
  status: string, 
  cancellationReason?: string
): Promise<ApiResponse<Booking>> => {
  const res = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, {
    status,
    cancellationReason
  });
  return res.data;
};

// ---- Driver Endpoints ----

/**
 * Get driver's current status including active trips and queue position
 */
export const getDriverStatus = async (): Promise<ApiResponse<DriverStatus>> => {
  const res = await api.get<ApiResponse<DriverStatus>>('/drivers/status');
  return res.data;
};

/**
 * Declare driver availability for a specific route
 */
export const declareAvailability = async (availabilityData: AvailabilityRequest): Promise<ApiResponse<{
  trip: Trip;
  queuePosition: number;
  status: string;
  message: string;
}>> => {
  const res = await api.post<ApiResponse<any>>('/drivers/available', availabilityData);
  return res.data;
};

/**
 * Get trip capacity status for active trip
 */
export const getTripCapacityStatus = async (): Promise<ApiResponse<TripCapacityStatus>> => {
  const res = await api.get<ApiResponse<TripCapacityStatus>>('/drivers/trip-capacity');
  return res.data;
};

/**
 * Cancel waiting trip (if no bookings)
 */
export const cancelWaitingTrip = async (): Promise<ApiResponse<any>> => {
  const res = await api.post<ApiResponse<any>>('/drivers/cancel-waiting-trip');
  return res.data;
};

/**
 * Get driver's trip history
 */
export const getDriverTrips = async (params: {
  status?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
} = {}): Promise<ApiResponse<{ trips: DriverTrip[]; total: number }>> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const res = await api.get<ApiResponse<{ trips: DriverTrip[]; total: number }>>(
    `/drivers/trips?${queryParams.toString()}`
  );
  return res.data;
};

/**
 * Update trip status (start, complete, etc.)
 */
export const updateTripStatus = async (tripId: string, status: string): Promise<ApiResponse<Trip>> => {
  const res = await api.patch<ApiResponse<Trip>>(`/drivers/trips/${tripId}/status`, { status });
  return res.data;
};

/**
 * Complete a trip
 */
export const completeTrip = async (tripId: string): Promise<ApiResponse<Trip>> => {
  const res = await api.patch<ApiResponse<Trip>>(`/drivers/trips/${tripId}/complete`);
  return res.data;
};

/**
 * Get driver earnings for a period
 */
export const getDriverEarnings = async (params: {
  startDate?: string;
  endDate?: string;
} = {}): Promise<ApiResponse<DriverEarnings>> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const res = await api.get<ApiResponse<DriverEarnings>>(
    `/drivers/earnings?${queryParams.toString()}`
  );
  return res.data;
};

/**
 * Get driver's current queue position and wait time
 */
export const getDriverQueue = async (): Promise<ApiResponse<any>> => {
  const res = await api.get<ApiResponse<any>>('/drivers/queue');
  return res.data;
};

/**
 * Get driver profile
 */
export const getDriverProfile = async (): Promise<ApiResponse<Driver>> => {
  const res = await api.get<ApiResponse<Driver>>('/drivers/profile');
  return res.data;
};

// ---- Trip Management (Driver) ----

/**
 * Get bookings for a specific trip (driver view)
 */
export const getTripBookings = async (tripId: string): Promise<ApiResponse<{ 
  bookings: Booking[]; 
  summary: any 
}>> => {
  const res = await api.get<ApiResponse<{ bookings: Booking[]; summary: any }>>(
    `/bookings/trip/${tripId}`
  );
  return res.data;
};

/**
 * Check in passenger for a trip
 */
export const checkInPassenger = async (bookingId: string): Promise<ApiResponse<Booking>> => {
  const res = await api.patch<ApiResponse<Booking>>(`/bookings/${bookingId}/check-in`);
  return res.data;
};

/**
 * Mark passenger as no-show
 */
export const markPassengerNoShow = async (bookingId: string): Promise<ApiResponse<Booking>> => {
  const res = await api.patch<ApiResponse<Booking>>(`/bookings/${bookingId}/no-show`);
  return res.data;
};

// ---- Payment Endpoints ----

/**
 * Create payment intent for booking
 */
export const createPaymentIntent = async (
  bookingId: string, 
  savePaymentMethod: boolean = false
): Promise<PaymentIntentResponse> => {
  const res = await api.post<PaymentIntentResponse>('/payments/intent', {
    bookingId,
    savePaymentMethod
  });
  return res.data;
};

/**
 * Confirm payment intent
 */
export const confirmPayment = async (
  paymentId: string, 
  paymentMethodId?: string
): Promise<ApiResponse<{
  payment: any;
  paymentIntent: any;
}>> => {
  const res = await api.post<ApiResponse<any>>(`/payments/${paymentId}/confirm`, {
    paymentMethodId
  });
  return res.data;
};

/**
 * Cancel payment
 */
export const cancelPayment = async (
  paymentId: string, 
  reason?: string
): Promise<ApiResponse<any>> => {
  const res = await api.post<ApiResponse<any>>(`/payments/${paymentId}/cancel`, {
    reason
  });
  return res.data;
};

/**
 * Process payment with real Stripe integration
 */
export const processStripePayment = async (
  paymentIntentId: string,
  paymentMethodId: string
): Promise<ApiResponse<{ paymentIntent: any; booking: Booking }>> => {
  const res = await api.post<ApiResponse<{ paymentIntent: any; booking: Booking }>>(
    `/payments/${paymentIntentId}/process`,
    { paymentMethodId }
  );
  return res.data;
};

/**
 * Get saved payment methods
 */
export const getSavedPaymentMethods = async (): Promise<ApiResponse<any[]>> => {
  const res = await api.get<ApiResponse<any[]>>('/payments/methods');
  return res.data;
};

/**
 * Create setup intent for saving payment method
 */
export const createSetupIntent = async (): Promise<ApiResponse<{ 
  clientSecret: string; 
  setupIntent: any 
}>> => {
  const res = await api.post<ApiResponse<{ clientSecret: string; setupIntent: any }>>(
    '/payments/setup-intent'
  );
  return res.data;
};

/**
 * Save payment method for future use
 */
export const savePaymentMethod = async (setupIntentId: string): Promise<ApiResponse<any>> => {
  const res = await api.post<ApiResponse<any>>('/payments/save-method', {
    setupIntentId
  });
  return res.data;
};

/**
 * Create refund for payment
 */
export const createRefund = async (
  paymentId: string,
  amount?: number,
  reason?: string
): Promise<ApiResponse<any>> => {
  const res = await api.post<ApiResponse<any>>(`/payments/${paymentId}/refund`, {
    amount,
    reason
  });
  return res.data;
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId: string): Promise<ApiResponse<any>> => {
  const res = await api.get<ApiResponse<any>>(`/payments/${paymentId}`);
  return res.data;
};

/**
 * Get user's payment history
 */
export const getMyPayments = async (params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ApiResponse<{
  payments: any[];
  total: number;
  totalPages: number;
  currentPage: number;
}>> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const res = await api.get<ApiResponse<any>>(`/payments/my?${queryParams.toString()}`);
  return res.data;
};

// ---- Schedule Endpoints ----
export const getSchedules = async (): Promise<ApiResponse<Schedule[]>> => {
  const res = await api.get<ApiResponse<Schedule[]>>('/schedules');
  return res.data;
};

export const getScheduleById = async (id: string): Promise<ApiResponse<Schedule>> => {
  const res = await api.get<ApiResponse<Schedule>>(`/schedules/${id}`);
  return res.data;
};

// ---- Push Notifications ----

/**
 * Register device for push notifications
 */
export const registerPushToken = async (
  token: string, 
  deviceType: 'ios' | 'android'
): Promise<ApiResponse<any>> => {
  const res = await api.post<ApiResponse<any>>('/notifications/register', {
    pushToken: token,
    deviceType,
    platform: 'mobile'
  });
  return res.data;
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (preferences: {
  tripUpdates: boolean;
  bookingAlerts: boolean;
  promotions: boolean;
  sound?: boolean;
  vibration?: boolean;
}): Promise<ApiResponse<any>> => {
  const res = await api.patch<ApiResponse<any>>('/notifications/preferences', preferences);
  return res.data;
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (): Promise<ApiResponse<any>> => {
  const res = await api.get<ApiResponse<any>>('/notifications/preferences');
  return res.data;
};

// ---- Real-time Trip Updates ----

/**
 * Join trip room for real-time updates
 */
export const joinTripRoom = async (tripId: string): Promise<ApiResponse<any>> => {
  const res = await api.post<ApiResponse<any>>(`/trips/${tripId}/join`);
  return res.data;
};

/**
 * Leave trip room
 */
export const leaveTripRoom = async (tripId: string): Promise<ApiResponse<any>> => {
  const res = await api.post<ApiResponse<any>>(`/trips/${tripId}/leave`);
  return res.data;
};

/**
 * Send trip update to passengers
 */
export const sendTripUpdate = async (
  tripId: string, 
  message: string, 
  type: 'info' | 'warning' | 'delay'
): Promise<ApiResponse<any>> => {
  const res = await api.post<ApiResponse<any>>(`/trips/${tripId}/update`, {
    message,
    type,
    timestamp: new Date().toISOString()
  });
  return res.data;
};

// ---- Offline Support ----

/**
 * Sync offline data when connection is restored
 */
export const syncOfflineData = async (offlineActions: any[]): Promise<ApiResponse<any>> => {
  const res = await api.post<ApiResponse<any>>('/sync/offline', {
    actions: offlineActions,
    timestamp: new Date().toISOString()
  });
  return res.data;
};

/**
 * Get essential data for offline mode
 */
export const getOfflineData = async (): Promise<ApiResponse<{
  stations: Station[];
  userBookings: Booking[];
  driverTrips?: DriverTrip[];
}>> => {
  const res = await api.get<ApiResponse<{
    stations: Station[];
    userBookings: Booking[];
    driverTrips?: DriverTrip[];
  }>>('/sync/essential-data');
  return res.data;
};

// ---- Statistics and Analytics ----

/**
 * Get booking statistics
 */
export const getBookingStats = async (params: {
  startDate?: string;
  endDate?: string;
} = {}): Promise<ApiResponse<any>> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const res = await api.get<ApiResponse<any>>(`/bookings/stats?${queryParams.toString()}`);
  return res.data;
};

/**
 * Get passenger analytics
 */
export const getPassengerAnalytics = async (params: {
  months?: number;
} = {}): Promise<ApiResponse<any>> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const res = await api.get<ApiResponse<any>>(`/bookings/passenger-analytics?${queryParams.toString()}`);
  return res.data;
};

/**
 * Get payment statistics
 */
export const getPaymentStats = async (): Promise<ApiResponse<any>> => {
  const res = await api.get<ApiResponse<any>>('/payments/stats');
  return res.data;
};

// ---- Health Check ----

/**
 * Check API health status
 */
export const getHealthStatus = async (): Promise<ApiResponse<{
  status: string;
  timestamp: string;
  environment: string;
  services: any;
}>> => {
  const res = await api.get<ApiResponse<any>>('/health');
  return res.data;
};

export default api;
