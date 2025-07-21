import { setupAxiosMock, apiClient } from './axiosMock';

// Initialize the mock
setupAxiosMock();

// Example usage
export const exampleUsage = async () => {
  try {
    console.log('🚀 Testing Axios Mock...');

    // Test authentication
    const auth = await apiClient.authenticate('valid-token');
    console.log('✅ Auth success:', auth);

    // Test fetching page 1
    const page1 = await apiClient.fetchData(1);
    console.log('✅ Page 1 data:', page1.data.topic);

    // Test fetching page 2
    const page2 = await apiClient.fetchData(2);
    console.log('✅ Page 2 data:', page2.data.topic);

    // Test with filters
    const filtered = await apiClient.fetchDataWithFilters({
      page: 1,
      keywords: ['manchester united', 'transfer'],
      platforms: ['twitter', 'instagram']
    });
    console.log('✅ Filtered data:', filtered.data.topic);

    // Test invalid page
    try {
      await apiClient.fetchData(999);
    } catch (error: any) {
      console.log('✅ Expected error for invalid page:', error.response?.status);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Integration with your existing DataManager
export const createMockDataFetcher = () => {
  return {
    async fetchNextPage(currentPage: number) {
      try {
        const data = await apiClient.fetchData(currentPage + 1);
        return data;
      } catch (error) {
        console.error('Error fetching page:', error);
        return null;
      }
    }
  };
};

// Run example if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  exampleUsage();
}