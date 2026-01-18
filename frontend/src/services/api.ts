import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest, ApiResponse } from '@shared/types';

class ApiService {
  private api: AxiosInstance;
  private accessToken: string | null = null;
  private isRefreshing: boolean = false; // Prevent multiple refresh attempts

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
      withCredentials: true, // Include cookies for refresh token
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add access token
    this.api.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't already tried to refresh and we're not already refreshing
        if (error.response?.status === 401 && !originalRequest._retry && !this.isRefreshing) {
          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Try to refresh token
            const refreshResponse = await this.api.post('/auth/refresh');
            const { accessToken } = refreshResponse.data.data;
            
            this.setAccessToken(accessToken);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear tokens but don't redirect
            // Let React Router handle the redirect
            this.clearTokens();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  clearTokens(): void {
    this.accessToken = null;
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/register', data);
    return response.data.data!;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/login', data);
    return response.data.data!;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
    this.clearTokens();
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    const response: AxiosResponse<ApiResponse<{ accessToken: string }>> = await this.api.post('/auth/refresh');
    return response.data.data!;
  }

  async getCurrentUser(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/auth/me');
    return response.data.data!;
  }

  // Generic API methods
  async get<T>(url: string): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.get(url);
    return response.data.data!;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.post(url, data);
    return response.data.data!;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.put(url, data);
    return response.data.data!;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.patch(url, data);
    return response.data.data!;
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.delete(url);
    return response.data.data!;
  }
}

export const apiService = new ApiService();