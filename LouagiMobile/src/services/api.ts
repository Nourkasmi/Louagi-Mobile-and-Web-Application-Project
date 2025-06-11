import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('@auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }
    
    return data;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse(response);
  }

  async register(userData: any) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return this.handleResponse(response);
  }

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Trips endpoints
  async getTrips(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/trips?${queryParams}`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getTripById(tripId: string) {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Bookings endpoints
  async createBooking(bookingData: {
    tripId: string;
    seats: number;
    specialRequests?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(bookingData),
    });
    return this.handleResponse(response);
  }

  async getMyBookings(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/bookings/my?${queryParams}`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async cancelBooking(bookingId: string, reason?: string) {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ cancellationReason: reason }),
    });
    return this.handleResponse(response);
  }

  // Driver endpoints
  async declareAvailability(availabilityData: {
    stationId: string;
    scheduleId: string;
    destinationId: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/drivers/available`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(availabilityData),
    });
    return this.handleResponse(response);
  }

  async getDriverStatus() {
    const response = await fetch(`${API_BASE_URL}/drivers/status`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getDriverTrips() {
    const response = await fetch(`${API_BASE_URL}/drivers/trips`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateTripStatus(tripId: string, status: string) {
    const response = await fetch(`${API_BASE_URL}/drivers/trips/${tripId}/status`, {
      method: 'PATCH',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return this.handleResponse(response);
  }

  async completeTrip(tripId: string) {
    const response = await fetch(`${API_BASE_URL}/drivers/trips/${tripId}/complete`, {
      method: 'PATCH',
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getDriverEarnings(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${API_BASE_URL}/drivers/earnings?${params}`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Stations and Destinations
  async getStations() {
    const response = await fetch(`${API_BASE_URL}/stations`);
    return this.handleResponse(response);
  }

  async getDestinations() {
    const response = await fetch(`${API_BASE_URL}/destinations`);
    return this.handleResponse(response);
  }

  async getSchedules() {
    const response = await fetch(`${API_BASE_URL}/schedules`);
    return this.handleResponse(response);
  }

  // Payment endpoints
  async createPaymentIntent(bookingId: string) {
    const response = await fetch(`${API_BASE_URL}/payments/intent`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ bookingId }),
    });
    return this.handleResponse(response);
  }

  async getPaymentMethods() {
    const response = await fetch(`${API_BASE_URL}/payments/methods`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getMyPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/payments/my?${queryParams}`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();
