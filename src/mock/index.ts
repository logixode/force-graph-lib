// Mock Module Exports
export { setupAxiosMock, cleanupAxiosMock, mock, apiClient as mockApiClient } from './axiosMock';
export { exampleUsage, createMockDataFetcher } from './mockExample';

// Re-export data for convenience
export { mockData, getMockDataByPage, getAvailablePages } from '../data/mockData';