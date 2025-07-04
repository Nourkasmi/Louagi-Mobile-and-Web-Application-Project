// 📁 src/services/enhancedApi.ts - Enhanced API Service with Better UX
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../config';
import store from '../store/store';
import { logout } from '../store/authSlice';

// Types
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: any;
    timestamp?: string;
}

export interface ApiError {
    message: string;
    code: string;
    status?: number;
    details?: any;
}

export interface RetryConfig {
    maxRetries: number;
    retryDelay: number;
    retryCondition?: (error: AxiosError) => boolean;
}

export interface RequestQueueItem {
    id: string;
    config: InternalAxiosRequestConfig;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timestamp: number;
}

// Enhanced API Service Class
class EnhancedApiService {
    private api: AxiosInstance;
    private isOnline: boolean = true;
    private requestQueue: RequestQueueItem[] = [];
    private retryConfig: RetryConfig = {
        maxRetries: 3,
        retryDelay: 1000,
        retryCondition: (error: AxiosError) => {
            return !error.response || error.response.status >= 500;
        },
    };

    constructor() {
        this.api = axios.create({
            baseURL: Config.API_BASE_URL,
            timeout: 15000, // 15 seconds timeout
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
            },
        });

        this.setupInterceptors();
        this.setupNetworkListener();
    }

    private setupInterceptors(): void {
        // Request interceptor
        this.api.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                // Add authentication token
                const token = global.authToken || await AsyncStorage.getItem('louagi_token');
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                // Add request ID for tracking
                config.metadata = {
                    requestId: this.generateRequestId(),
                    startTime: Date.now(),
                };

                // Log request in development
                if (__DEV__) {
                    console.log(`🔄 API Request [${config.metadata.requestId}]:`, {
                        method: config.method?.toUpperCase(),
                        url: config.url,
                        params: config.params,
                        data: config.data ? 'Present' : 'None',
                    });
                }

                return config;
            },
            (error) => {
                console.error('❌ Request interceptor error:', error);
                return Promise.reject(this.formatError(error));
            }
        );

        // Response interceptor
        this.api.interceptors.response.use(
            (response) => {
                const duration = Date.now() - response.config.metadata?.startTime || 0;

                if (__DEV__) {
                    console.log(`✅ API Success [${response.config.metadata?.requestId}]:`, {
                        status: response.status,
                        duration: `${duration}ms`,
                        url: response.config.url,
                    });
                }

                return response;
            },
            async (error: AxiosError) => {
                const duration = Date.now() - error.config?.metadata?.startTime || 0;

                if (__DEV__) {
                    console.error(`❌ API Error [${error.config?.metadata?.requestId}]:`, {
                        status: error.response?.status,
                        duration: `${duration}ms`,
                        url: error.config?.url,
                        message: error.message,
                    });
                }

                return this.handleResponseError(error);
            }
        );
    }

    private setupNetworkListener(): void {
        NetInfo.addEventListener(state => {
            const wasOffline = !this.isOnline;
            this.isOnline = state.isConnected ?? false;

            if (__DEV__) {
                console.log(`🌐 Network status: ${this.isOnline ? 'Online' : 'Offline'}`);
            }

            // Process queued requests when coming back online
            if (wasOffline && this.isOnline) {
                this.processRequestQueue();
            }
        });
    }

    private async handleResponseError(error: AxiosError): Promise<never> {
        // Handle authentication errors
        if (error.response?.status === 401) {
            await this.handleAuthError();
            return Promise.reject(this.formatError(error, 'Authentication failed. Please log in again.'));
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;

            if (__DEV__) {
                console.warn(`⏱️ Rate limited. Retrying after ${delay}ms`);
            }

            await this.delay(delay);
            return this.retryRequest(error.config!);
        }

        // Handle network errors
        if (!error.response && this.isOnline) {
            // Network error but we think we're online - might be server down
            return Promise.reject(this.formatError(error, 'Server temporarily unavailable. Please try again.'));
        }

        // Handle offline scenarios
        if (!this.isOnline) {
            return this.handleOfflineRequest(error);
        }

        // Handle server errors with retry
        if (this.retryConfig.retryCondition?.(error)) {
            return this.retryRequest(error.config!);
        }

        return Promise.reject(this.formatError(error));
    }

    private async handleAuthError(): Promise<void> {
        try {
            // Clear stored tokens
            await Promise.all([
                AsyncStorage.removeItem('louagi_token'),
                AsyncStorage.removeItem('louagi_user'),
            ]);

            // Clear global token
            global.authToken = undefined;

            // Dispatch logout action
            store.dispatch(logout());

            if (__DEV__) {
                console.log('🔐 User logged out due to auth error');
            }
        } catch (error) {
            console.error('Error during auth cleanup:', error);
        }
    }

    private async handleOfflineRequest(error: AxiosError): Promise<never> {
        // For GET requests, try to queue them
        if (error.config?.method?.toLowerCase() === 'get') {
            return this.queueRequest(error.config);
        }

        // For other requests, provide offline error
        return Promise.reject(this.formatError(error, 'You appear to be offline. Please check your connection.'));
    }

    private async queueRequest(config: InternalAxiosRequestConfig): Promise<any> {
        return new Promise((resolve, reject) => {
            const queueItem: RequestQueueItem = {
                id: this.generateRequestId(),
                config,
                resolve,
                reject,
                timestamp: Date.now(),
            };

            this.requestQueue.push(queueItem);

            if (__DEV__) {
                console.log(`📥 Request queued [${queueItem.id}]. Queue size: ${this.requestQueue.length}`);
            }

            // Auto-reject after 5 minutes
            setTimeout(() => {
                const index = this.requestQueue.findIndex(item => item.id === queueItem.id);
                if (index !== -1) {
                    this.requestQueue.splice(index, 1);
                    reject(this.formatError(new Error('Request timeout'), 'Request timed out while offline.'));
                }
            }, 300000);
        });
    }

    private async processRequestQueue(): Promise<void> {
        if (this.requestQueue.length === 0) return;

        if (__DEV__) {
            console.log(`📤 Processing ${this.requestQueue.length} queued requests`);
        }

        const queue = [...this.requestQueue];
        this.requestQueue = [];

        for (const item of queue) {
            try {
                const response = await this.api.request(item.config);
                item.resolve(response);
            } catch (error) {
                item.reject(error);
            }
        }
    }

    private async retryRequest(config: InternalAxiosRequestConfig, retryCount = 0): Promise<any> {
        if (retryCount >= this.retryConfig.maxRetries) {
            throw this.formatError(new Error('Max retries exceeded'), 'Request failed after multiple attempts.');
        }

        const delay = this.retryConfig.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        await this.delay(delay);

        if (__DEV__) {
            console.log(`🔄 Retrying request (${retryCount + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`);
        }

        try {
            return await this.api.request(config);
        } catch (error) {
            return this.retryRequest(config, retryCount + 1);
        }
    }

    private formatError(error: any, customMessage?: string): ApiError {
        const baseError: ApiError = {
            message: customMessage || 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR',
        };

        if (error?.response) {
            // Server responded with error status
            baseError.status = error.response.status;
            baseError.message = customMessage || error.response.data?.message || this.getStatusMessage(error.response.status);
            baseError.code = this.getErrorCode(error.response.status);
            baseError.details = error.response.data;
        } else if (error?.request) {
            // Request was made but no response received
            baseError.message = customMessage || 'Network error. Please check your connection.';
            baseError.code = 'NETWORK_ERROR';
        } else if (error?.message) {
            // Something else happened
            baseError.message = customMessage || error.message;
            baseError.code = 'REQUEST_ERROR';
        }

        return baseError;
    }

    private getStatusMessage(status: number): string {
        const messages: Record<number, string> = {
            400: 'Invalid request. Please check your input.',
            401: 'Authentication required. Please log in.',
            403: 'Access denied. You don\'t have permission.',
            404: 'Resource not found.',
            409: 'Conflict. Resource already exists.',
            422: 'Invalid data provided.',
            429: 'Too many requests. Please slow down.',
            500: 'Server error. Please try again later.',
            502: 'Service temporarily unavailable.',
            503: 'Service temporarily unavailable.',
        };

        return messages[status] || 'An error occurred. Please try again.';
    }

    private getErrorCode(status: number): string {
        const codes: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'VALIDATION_ERROR',
            429: 'RATE_LIMITED',
            500: 'SERVER_ERROR',
            502: 'BAD_GATEWAY',
            503: 'SERVICE_UNAVAILABLE',
        };

        return codes[status] || 'UNKNOWN_ERROR';
    }

    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Public methods
    public async get<T = any>(url: string, config?: any): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.get(url, config);
            return this.formatSuccessResponse(response.data);
        } catch (error) {
            throw error;
        }
    }

    public async post<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.post(url, data, config);
            return this.formatSuccessResponse(response.data);
        } catch (error) {
            throw error;
        }
    }

    public async put<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.put(url, data, config);
            return this.formatSuccessResponse(response.data);
        } catch (error) {
            throw error;
        }
    }

    public async patch<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.patch(url, data, config);
            return this.formatSuccessResponse(response.data);
        } catch (error) {
            throw error;
        }
    }

    public async delete<T = any>(url: string, config?: any): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.delete(url, config);
            return this.formatSuccessResponse(response.data);
        } catch (error) {
            throw error;
        }
    }

    private formatSuccessResponse<T>(data: any): ApiResponse<T> {
        // If backend already returns in our format
        if (data && typeof data === 'object' && 'success' in data) {
            return {
                ...data,
                timestamp: new Date().toISOString(),
            };
        }

        // Otherwise, wrap the response
        return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
        };
    }

    // Utility methods
    public getNetworkStatus(): boolean {
        return this.isOnline;
    }

    public getQueueSize(): number {
        return this.requestQueue.length;
    }

    public clearQueue(): void {
        this.requestQueue.forEach(item => {
            item.reject(this.formatError(new Error('Queue cleared'), 'Request was cancelled.'));
        });
        this.requestQueue = [];
    }

    public updateBaseURL(newBaseURL: string): void {
        this.api.defaults.baseURL = newBaseURL;
        if (__DEV__) {
            console.log(`🔄 API base URL updated to: ${newBaseURL}`);
        }
    }

    public setTimeout(timeout: number): void {
        this.api.defaults.timeout = timeout;
        if (__DEV__) {
            console.log(`⏱️ API timeout updated to: ${timeout}ms`);
        }
    }
}

// Create and export singleton instance
export const enhancedApi = new EnhancedApiService();

// Enhanced authentication functions
export const enhancedLogin = async (email: string, password: string) => {
    try {
        const response = await enhancedApi.post('/auth/login', {
            email: email.trim().toLowerCase(),
            password
        });

        // Store token if login successful
        if (response.success && response.data?.token) {
            await AsyncStorage.setItem('louagi_token', response.data.token);
            global.authToken = response.data.token;
        }

        return response;
    } catch (error) {
        throw error;
    }
};

export const enhancedRegister = async (userData: any) => {
    try {
        const response = await enhancedApi.post('/auth/register', userData);

        // Store token if registration successful
        if (response.success && response.data?.token) {
            await AsyncStorage.setItem('louagi_token', response.data.token);
            global.authToken = response.data.token;
        }

        return response;
    } catch (error) {
        throw error;
    }
};

export const enhancedLogout = async () => {
    try {
        // Attempt to notify server
        await enhancedApi.post('/auth/logout');
    } catch (error) {
        // Continue with local logout even if server request fails
        console.warn('Server logout failed, continuing with local logout:', error);
    } finally {
        // Always clear local data
        await Promise.all([
            AsyncStorage.removeItem('louagi_token'),
            AsyncStorage.removeItem('louagi_user'),
        ]);
        global.authToken = undefined;
    }
};

export default enhancedApi;