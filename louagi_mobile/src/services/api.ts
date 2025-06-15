// src/services/api.ts
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
}

export interface Destination {
  id: string;
  description: string;
  startStation: Station;
  endStation: Station;
  distance: number;
  basePrice: number;
  estimatedDuration: number;
}

export interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Driver {
  id: string;
  user: {
    username: string;
  };
  rating: number;
  vehicleType?: string;
  vehicleCapacity: number;
}

export interface Trip {
  id: string;
  route: Destination;
  schedule: Schedule;
  driver: Driver;
  departureTime: string;
  estimatedArrivalTime: string;
  basePrice: number;
  currentPrice: number;
  capacity: number;
  availableSeats: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
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
  trip: Trip;
  createdAt: string;
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
}

export interface BookingsResponse {
  success: boolean;
  bookings: Booking[];
  total: number;
}

export interface PaymentIntentResponse {
  success: boolean;
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
  };
  clientSecret: string;
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

// ---- Station Endpoints ----
export const getStations = async (page = 1, limit = 10): Promise<StationsResponse> => {
  const res = await api.get<StationsResponse>(`/stations?page=${page}&limit=${limit}`);
  return res.data;
};

export const getStationById = async (id: string): Promise<ApiResponse<Station>> => {
  const res = await api.get<ApiResponse<Station>>(`/stations/${id}`);
  return res.data;
};

// ---- Destination Endpoints ----
export const getDestinations = async (stationId?: string): Promise<DestinationsResponse> => {
  const url = stationId ? `/destinations?startId=${stationId}` : '/destinations';
  const res = await api.get<DestinationsResponse>(url);
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
  status?: string;
  page?: number;
  limit?: number;
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
}): Promise<ApiResponse<Booking>> => {
  const res = await api.post<ApiResponse<Booking>>('/bookings', bookingData);
  return res.data;
};

export const getMyBookings = async (params: {
  status?: string;
  page?: number;
  limit?: number;
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

export const getBookingById = async (id: string): Promise<ApiResponse<Booking>> => {
  const res = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
  return res.data;
};

export const cancelBooking = async (id: string, reason?: string): Promise<ApiResponse<Booking>> => {
  const res = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/cancel`, {
    cancellationReason: reason
  });
  return res.data;
};

// ---- Payment Endpoints ----
export const createPaymentIntent = async (bookingId: string): Promise<PaymentIntentResponse> => {
  const res = await api.post<PaymentIntentResponse>('/payments/intent', {
    bookingId,
    savePaymentMethod: false
  });
  return res.data;
};

export const confirmPayment = async (paymentId: string, paymentMethodId?: string): Promise<ApiResponse<any>> => {
  const res = await api.post<ApiResponse<any>>(`/payments/${paymentId}/confirm`, {
    paymentMethodId
  });
  return res.data;
};

// ---- Schedule Endpoints ----
export const getSchedules = async (): Promise<ApiResponse<Schedule[]>> => {
  const res = await api.get<ApiResponse<Schedule[]>>('/schedules');
  return res.data;
};

export default api;