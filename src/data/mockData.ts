import { FullResponse, Pagination } from '../../interfaces/graphResponse';
import dummy from './dummy';

// Mock data converted from JSON files
export const mockData: Record<string, FullResponse<Pagination> | FullResponse> = {
  ...dummy
};

// Helper function to get mock data by page
export const getMockDataByPage = (page: number): FullResponse<Pagination> | FullResponse | null => {
  const pageKey = `page${page}`;
  return mockData[pageKey] || null;
};

// Helper function to get all available pages
export const getAvailablePages = (): number[] => {
  return Object.keys(mockData)
    .filter(key => key.startsWith('page'))
    .map(key => parseInt(key.replace('page', '')))
    .sort((a, b) => a - b);
};