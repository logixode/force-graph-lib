import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { FullResponse } from '../../interfaces/graphResponse';

// API Configuration
export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// Default configuration
const defaultConfig: ApiConfig = {
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// API Client class
export class ApiClient {
  private client: AxiosInstance;

  constructor(config: Partial<ApiConfig> = {}) {
    const finalConfig = { ...defaultConfig, ...config };
    
    this.client = axios.create({
      baseURL: finalConfig.baseURL,
      timeout: finalConfig.timeout,
      headers: finalConfig.headers,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          // Redirect to login or emit event
        }
        return Promise.reject(error);
      }
    );
  }

  // Fetch data with pagination
  async fetchData(page: number = 1): Promise<FullResponse> {
    const response: AxiosResponse<FullResponse> = await this.client.get(`/data?page=${page}`);
    return response.data;
  }

  // Fetch data with filters
  async fetchDataWithFilters(filters: {
    page?: number;
    keywords?: string[];
    platforms?: string[];
    sentiment?: string;
  }): Promise<FullResponse> {
    const response: AxiosResponse<FullResponse> = await this.client.post('/data', filters);
    return response.data;
  }

  // Authentication
  async authenticate(token: string): Promise<any> {
    const response = await this.client.post('/auth', { token });
    
    // Store token if authentication is successful
    if (response.data.success && response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Get current configuration
  getConfig(): ApiConfig {
    return {
      baseURL: this.client.defaults.baseURL || '',
      timeout: this.client.defaults.timeout,
      headers: this.client.defaults.headers as Record<string, string>,
    };
  }
}

// Create default instance
export const apiClient = new ApiClient();

// Export factory function for custom configurations
export const createApiClient = (config: Partial<ApiConfig>) => new ApiClient(config);