// src/services/api.ts 
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

export const completeTrip = async (id: string): Promise<ApiResponse<Trip>> => {
  const res = await api.put(`/trips/${id}/complete`);
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

export const getDriverProfile = async (): Promise<ApiResponse<Driver>> => {
  try {
    console.log('📡 API: Getting driver profile...');
    const res = await api.get('/drivers/profile');
    console.log('📡 API: Driver profile response:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Get driver profile error:', error);
    
    let errorMessage = 'Failed to get driver profile';
    
    if (error.response?.status === 401) {
      errorMessage = 'Authentication required. Please log in again.';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied. Driver permissions required.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Driver profile not found.';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error. Please try again in a moment.';
    } else if (!error.response) {
      errorMessage = 'Network error. Please check your connection.';
    }
    
    return {
      success: false,
      message: errorMessage,
      error: {
        status: error.response?.status,
        data: error.response?.data
      }
    };
  }
};

export const updateDriverProfile = async (data: {
  vehicleType?: string;
  vehicleCapacity?: number;
  experience?: number;
  licenseNo?: string;
  licenseExpiry?: string;
}): Promise<ApiResponse<Driver>> => {
  try {
    console.log('📡 API: Updating driver profile with data:', data);
    const res = await api.put('/drivers/profile', data);
    console.log('📡 API: Update driver profile response:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Update driver profile error:', error);
    
    let errorMessage = 'Failed to update driver profile';
    
    if (error.response?.status === 400) {
      errorMessage = error.response?.data?.message || 'Invalid profile data provided.';
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication required. Please log in again.';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied. Driver permissions required.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Driver profile not found.';
    } else if (error.response?.status === 422) {
      errorMessage = error.response?.data?.message || 'Invalid data provided.';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error. Please try again in a moment.';
    } else if (!error.response) {
      errorMessage = 'Network error. Please check your connection.';
    }
    
    return {
      success: false,
      message: errorMessage,
      error: {
        status: error.response?.status,
        data: error.response?.data
      }
    };
  }
};

export const getDriverStatus = async (): Promise<ApiResponse<DriverStatus & { queueInfo?: any }>> => {
  try {
    console.log('📡 API: Getting driver status...');
    const res = await api.get('/drivers/status');
    console.log('📡 API: Driver status response:', res.data);
    
    // Handle different response structures
    let normalizedResponse: ApiResponse<DriverStatus & { queueInfo?: any }>;
    
    if (res.data?.success !== undefined) {
      normalizedResponse = {
        success: res.data.success,
        message: res.data.message,
        data: res.data.data || res.data.driver || res.data
      };
    } else {
      normalizedResponse = {
        success: true,
        data: res.data
      };
    }
    
    // If driver has queue entry, format it for the queue status card
    if (normalizedResponse.data?.queueEntry) {
      const queueEntry = normalizedResponse.data.queueEntry;
      normalizedResponse.data.queueInfo = {
        inQueue: true,
        position: queueEntry.position,
        status: queueEntry.status,
        waitingTimeMinutes: Math.round((new Date().getTime() - new Date(queueEntry.joinedAt || queueEntry.createdAt).getTime()) / (1000 * 60)),
        estimatedDepartureTime: queueEntry.estimatedDepartureTime,
        formattedDepartureTime: queueEntry.formattedDepartureTime,
        minutesUntilDeparture: queueEntry.minutesUntilDeparture,
        station: queueEntry.station?.name,
        destination: queueEntry.destination?.description,
        schedule: queueEntry.schedule ? `${queueEntry.schedule.startTime} - ${queueEntry.schedule.endTime}` : undefined,
        scheduleStatus: queueEntry.scheduleStatus,
      };
    } else {
      normalizedResponse.data.queueInfo = { inQueue: false };
    }
    
    console.log('✅ Driver status processed:', {
      success: normalizedResponse.success,
      hasQueueEntry: !!normalizedResponse.data?.queueEntry,
      inQueue: normalizedResponse.data?.queueInfo?.inQueue
    });
    
    return normalizedResponse;
  } catch (error: any) {
    console.error('❌ Get driver status error:', error);
    
    let errorMessage = 'Failed to get driver status';
    
    if (error.response?.status === 401) {
      errorMessage = 'Authentication required. Please log in again.';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied. Driver permissions required.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Driver profile not found.';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error. Please try again in a moment.';
    } else if (!error.response) {
      errorMessage = 'Network error. Please check your connection.';
    }
    
    return {
      success: false,
      message: errorMessage,
      data: {
        profile: null,
        availabilityStatus: 'available',
        statusMessage: 'Status unavailable',
        canDeclareAvailability: true,
        canDeclareFull: false,
        systemType: 'time-based',
        queueInfo: { inQueue: false }
      } as any,
      error: {
        status: error.response?.status,
        data: error.response?.data
      }
    };
  }
};

export const getDriverEarnings = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{ earnings: any }>> => {
  const res = await api.get('/drivers/earnings', { params });
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
    console.log('📡 API: getDriverTrips called with params:', params);

    // Build query parameters properly
    const queryParams: any = {};
    
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.status && params.status !== 'all') {
      queryParams.status = params.status;
      console.log('🎯 Filtering by status:', params.status);
    }

    console.log('📡 Final query params:', queryParams);

    const response = await api.get('/drivers/trips', { params: queryParams });
    
    console.log('📡 Raw API response:', {
      status: response.status,
      dataType: typeof response.data,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
    });

    // Handle different response structures from backend
    let normalizedResponse: ApiResponse<{ trips: Trip[] }>;

    if (response.data?.success !== undefined) {
      // Backend returns { success: true, data: { trips: [...] } }
      normalizedResponse = {
        success: response.data.success,
        message: response.data.message,
        data: { 
          trips: response.data.data?.trips || response.data.trips || [] 
        }
      };
    } else if (Array.isArray(response.data)) {
      // Backend returns trips array directly
      normalizedResponse = {
        success: true,
        data: { trips: response.data }
      };
    } else if (response.data?.trips) {
      // Backend returns { trips: [...] } without success field
      normalizedResponse = {
        success: true,
        data: { trips: response.data.trips }
      };
    } else if (response.data?.data?.trips) {
      // Backend returns { data: { trips: [...] } }
      normalizedResponse = {
        success: true,
        message: response.data.message,
        data: { trips: response.data.data.trips }
      };
    } else {
      console.warn('⚠️ Unexpected response structure:', response.data);
      normalizedResponse = {
        success: false,
        message: 'Unexpected response format',
        data: { trips: [] }
      };
    }

    console.log('✅ Normalized response:', {
      success: normalizedResponse.success,
      tripsCount: normalizedResponse.data?.trips?.length || 0,
      message: normalizedResponse.message
    });

    // Log trip statuses for debugging
    if (normalizedResponse.data?.trips?.length) {
      const statusCounts = normalizedResponse.data.trips.reduce((acc, trip) => {
        acc[trip.status] = (acc[trip.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('📊 API returned trips by status:', statusCounts);
    }

    return normalizedResponse;
  } catch (error: any) {
    console.error('❌ getDriverTrips error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    });

    // Enhanced error handling
    let errorMessage = 'Failed to fetch driver trips';
    
    if (error.response?.status === 401) {
      errorMessage = 'Authentication required. Please log in again.';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied. You don\'t have permission to view trips.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Trips endpoint not found.';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error. Please try again in a moment.';
    } else if (!error.response) {
      errorMessage = 'Network error. Please check your connection.';
    }

    return {
      success: false,
      message: errorMessage,
      data: { trips: [] },
      error: {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      }
    };
  }
};

// ==================== BOOKING ENDPOINTS ====================

export const createBooking = async (bookingData: {
  tripId: string;
  seats?: number;
  specialRequests?: string;
}): Promise<ApiResponse<Booking>> => {
  try {
    console.log(' API createBooking called with:', bookingData);

    const response = await api.post('/bookings', bookingData);

    console.log('📡 Raw API response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      dataType: typeof response.data,
      hasData: !!response.data?.data,
      hasBooking: !!response.data?.booking,
      success: response.data?.success
    });

    // 🔧 FIXED: Handle different response structures properly
    let normalizedResponse: ApiResponse<Booking>;

    // Check if response.data has the booking info
    if (response.data) {
      // Case 1: Response has success field
      if (response.data.success !== undefined) {
        if (response.data.success && (response.data.data || response.data.booking)) {
          normalizedResponse = {
            success: true,
            data: response.data.data || response.data.booking,
            message: response.data.message || 'Booking created successfully',
            wasAutoStarted: response.data.wasAutoStarted || false,
            autoConfirmedBookings: response.data.autoConfirmedBookings || 0,
          };
        } else {
          normalizedResponse = {
            success: false,
            message: response.data.message || 'Booking creation failed',
            error: response.data.error || response.data
          };
        }
      }
      // Case 2: Response data IS the booking (no wrapper)
      else if (response.data.id && response.data.tripId) {
        normalizedResponse = {
          success: true,
          data: response.data,
          message: 'Booking created successfully',
          wasAutoStarted: false,
          autoConfirmedBookings: 0,
        };
      }
      // Case 3: Response has booking field directly
      else if (response.data.booking) {
        normalizedResponse = {
          success: true,
          data: response.data.booking,
          message: response.data.message || 'Booking created successfully',
          wasAutoStarted: response.data.wasAutoStarted || false,
          autoConfirmedBookings: response.data.autoConfirmedBookings || 0,
        };
      }
      // Case 4: Unknown structure
      else {
        console.warn('⚠️ Unknown response structure:', response.data);
        normalizedResponse = {
          success: false,
          message: 'Unexpected response format from server',
          error: response.data
        };
      }
    } else {
      normalizedResponse = {
        success: false,
        message: 'No response data received',
        error: 'Empty response'
      };
    }

    console.log('✅ Normalized API response:', {
      success: normalizedResponse.success,
      hasData: !!normalizedResponse.data,
      message: normalizedResponse.message,
      bookingId: normalizedResponse.data?.id,
      wasAutoStarted: normalizedResponse.wasAutoStarted
    });

    return normalizedResponse;

  } catch (error: any) {
    console.error('❌ API createBooking error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      stack: error.stack?.split('\n').slice(0, 3)
    });

    // Enhanced error handling
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      let errorMessage = 'Failed to create booking';

      switch (status) {
        case 400:
          errorMessage = errorData?.message || 'Invalid booking data. Please check your selections.';
          break;
        case 401:
          errorMessage = 'Authentication required. Please log in again.';
          break;
        case 403:
          errorMessage = errorData?.message || 'You do not have permission to create bookings.';
          break;
        case 404:
          errorMessage = 'Trip not found. Please select a different trip.';
          break;
        case 409:
          errorMessage = errorData?.message || 'Booking conflict. You may already have a booking for this trip.';
          break;
        case 422:
          errorMessage = errorData?.message || 'Invalid booking data provided.';
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
      return {
        success: false,
        message: 'Network error. Please check your internet connection.',
        error: {
          type: 'network',
          message: error.message
        }
      };
    } else {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred.',
        error: {
          type: 'unknown',
          message: error.message
        }
      };
    }
  }
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
  clientSecret?: string;
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
  const params: any = {};
  if (months && months > 0) {
    params.months = months;
  }

  const res = await api.get('/bookings/passenger-analytics', { params });
  return res.data;
};

// ==================== QUEUE MANAGEMENT ====================

export const leaveQueue = async (): Promise<ApiResponse> => {
  try {
    console.log('📡 API: Leaving queue...');
    const res = await api.post('/queues/leave');
    console.log('📡 API: Leave queue response:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Leave queue error:', error);
    
    let errorMessage = 'Failed to leave queue';
    
    if (error.response?.status === 404) {
      errorMessage = 'You are not currently in any queue';
    } else if (error.response?.status === 400) {
      errorMessage = error.response?.data?.message || 'Cannot leave queue at this time';
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication required. Please log in again.';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error. Please try again in a moment.';
    } else if (!error.response) {
      errorMessage = 'Network error. Please check your connection.';
    }
    
    return {
      success: false,
      message: errorMessage,
      error: {
        status: error.response?.status,
        data: error.response?.data
      }
    };
  }
};

export const getQueueInfo = async (params: {
  stationId: string;
  scheduleId: string;
  destinationId: string;
}): Promise<ApiResponse<{
  totalWaiting: number;
  longestWaitMinutes: number;
  shouldCreateTrip: boolean;
  isPeakHour: boolean;
  nextTripETA: string;
}>> => {
  try {
    const res = await api.get('/queues', { params });
    return res.data;
  } catch (error: any) {
    console.error('❌ Get queue info error:', error);
    return {
      success: false,
      message: 'Failed to get queue information',
      data: {
        totalWaiting: 0,
        longestWaitMinutes: 0,
        shouldCreateTrip: false,
        isPeakHour: false,
        nextTripETA: 'Unknown'
      }
    };
  }
};

export const getStationQueues = async (stationId: string): Promise<ApiResponse<{
  stationId: string;
  totalQueues: number;
  queues: Array<{
    destinationId: string;
    description: string;
    count: number;
  }>;
}>> => {
  try {
    const res = await api.get('/queues/count', { params: { stationId } });
    return res.data;
  } catch (error: any) {
    console.error('❌ Get station queues error:', error);
    return {
      success: false,
      message: 'Failed to get station queues',
      data: {
        stationId,
        totalQueues: 0,
        queues: []
      }
    };
  }
};

// ==================== HELPER FUNCTIONS ====================

export const processStripePayment = async (paymentIntentId: string, paymentMethodId?: string) => {
  return { success: true, paymentIntentId, paymentMethodId };
};

// ==================== DEBUG FUNCTIONS ====================

export const getMyBookingsDebug = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{ bookings: Booking[]; summary: any }>> => {
  try {
    console.log('🔍 DEBUG: Making bookings API call with params:', params);

    const res = await api.get('/bookings/my', { params });

    console.log('🔍 DEBUG: Raw API response:', {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
      data: res.data,
      dataType: typeof res.data,
      dataKeys: res.data ? Object.keys(res.data) : [],
      dataStringified: JSON.stringify(res.data, null, 2)
    });

    if (res.data) {
      if (res.data.success !== undefined) {
        console.log('🔍 DEBUG: Response has success field:', res.data.success);

        if (res.data.success && res.data.data) {
          console.log('🔍 DEBUG: Success with nested data:', {
            dataKeys: Object.keys(res.data.data),
            hasBookings: 'bookings' in res.data.data,
            bookingsType: typeof res.data.data.bookings,
            bookingsLength: Array.isArray(res.data.data.bookings) ? res.data.data.bookings.length : 'not array'
          });
        }
      } else {
        console.log('🔍 DEBUG: Response without success field, checking direct properties:', {
          hasBookings: 'bookings' in res.data,
          bookingsType: typeof res.data.bookings,
          isArray: Array.isArray(res.data),
          directBookingsLength: Array.isArray(res.data.bookings) ? res.data.bookings.length : 'not array'
        });
      }
    }

    return res.data;
  } catch (error: any) {
    console.error('🔍 DEBUG: API Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      responseHeaders: error.response?.headers,
      requestUrl: error.config?.url,
      requestMethod: error.config?.method,
      requestParams: error.config?.params
    });

    throw error;
  }
};

export const testBookingsAPI = async () => {
  console.log('🧪 TESTING: Starting bookings API test...');

  try {
    const directResponse = await fetch(`${Config.API_BASE_URL}/bookings/my`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${global.authToken}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    console.log('🧪 TESTING: Direct fetch response:', {
      ok: directResponse.ok,
      status: directResponse.status,
      statusText: directResponse.statusText,
      headers: Object.fromEntries(directResponse.headers.entries())
    });

    const directData = await directResponse.json();
    console.log('🧪 TESTING: Direct fetch data:', {
      data: directData,
      stringified: JSON.stringify(directData, null, 2)
    });

    const wrapperResponse = await getMyBookingsDebug({ limit: 10 });
    console.log('🧪 TESTING: Wrapper response:', wrapperResponse);

    return {
      direct: directData,
      wrapper: wrapperResponse
    };
  } catch (error) {
    console.error('🧪 TESTING: Test failed:', error);
    throw error;
  }
};

// ==================== ERROR HANDLING ====================

api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data
      });
    }

    if (error.response?.status === 401) {
      global.authToken = undefined;
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;