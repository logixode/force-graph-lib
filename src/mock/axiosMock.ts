import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { getMockDataByPage } from '../data/mockData';
import { type FullResponse } from '../../interfaces/graphResponse';

// Create axios mock adapter
const mock = new MockAdapter(axios, { delayResponse: 500 }); // 500ms delay to simulate network

// Setup mock endpoints
export const setupAxiosMock = () => {
  // Mock GET /api/data with pagination
  mock.onGet(/\/api\/data/).reply((config) => {
    const url = new URL(config.url!, 'http://localhost');
    const page = parseInt(url.searchParams.get('page') || '1');
    
    const data = getMockDataByPage(page);
    
    if (data) {
      return [200, data];
    } else {
      return [404, { message: 'Page not found' }];
    }
  });

  // Mock POST /api/data with filters
  mock.onPost('/api/data').reply((config) => {
    const requestData = JSON.parse(config.data || '{}');
    const page = requestData.page || 1;
    
    // Get base data
    const data = getMockDataByPage(page);
    
    if (data) {
      // Apply filters if needed (simplified)
      if (requestData.keywords) {
        // Filter by keywords (simplified example)
        console.log('Filtering by keywords:', requestData.keywords);
      }
      
      return [200, data];
    } else {
      return [404, { message: 'Page not found' }];
    }
  });

  // Mock authentication endpoint
  mock.onPost('/api/auth').reply((config) => {
    const { token } = JSON.parse(config.data || '{}');
    
    if (token === 'valid-token') {
      return [200, { 
        success: true, 
        user: { id: 1, username: 'demo-user' },
        token: 'mock-jwt-token'
      }];
    } else {
      return [401, { success: false, message: 'Invalid token' }];
    }
  });

  console.log('✅ Axios mock adapter setup complete');
};

// Clean up mock (useful for testing)
export const cleanupAxiosMock = () => {
  mock.restore();
};

// Export the mock instance for advanced usage
export { mock };

// Simple API client using mocked axios
export const apiClient = {
  // Fetch data with pagination
  async fetchData(page: number = 1): Promise<FullResponse> {
    const response = await axios.get(`/api/data?page=${page}`);
    return response.data;
  },

  // Fetch data with filters
  async fetchDataWithFilters(filters: {
    page?: number;
    keywords?: string[];
    platforms?: string[];
    sentiment?: string;
  }): Promise<FullResponse> {
    const response = await axios.post('/api/data', filters);
    return response.data;
  },

  // Authenticate
  async authenticate(token: string): Promise<any> {
    const response = await axios.post('/api/auth', { token });
    return response.data;
  }
};