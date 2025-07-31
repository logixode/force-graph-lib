// Example showing how to use both real API and mock
import { createApiClient } from '../api';
import { setupAxiosMock, cleanupAxiosMock } from '../mock';

// Example 1: Using Real API Client
export const realApiExample = async () => {
  console.log('🌐 Using Real API Client...');
  
  // Create API client for production
  const prodClient = createApiClient({
    baseURL: 'https://api.example.com',
    timeout: 15000,
    headers: {
      'X-API-Key': 'your-api-key'
    }
  });

  try {
    // Use real API
    const data = await prodClient.fetchData(1);
    console.log('✅ Real API data:', data);
  } catch (error) {
    console.error('❌ Real API error:', error);
  }
};

// Example 2: Using Mock API
export const mockApiExample = async () => {
  console.log('🎭 Using Mock API...');
  
  // Setup mock
  setupAxiosMock();
  
  // Create API client (will use mocked endpoints)
  const mockClient = createApiClient({
    baseURL: '/api' // This will be intercepted by the mock
  });

  try {
    // Use mocked API
    const data = await mockClient.fetchData(1);
    console.log('✅ Mock API data:', data);
  } catch (error) {
    console.error('❌ Mock API error:', error);
  }
};

// Example 3: Environment-based switching
export const environmentBasedExample = async () => {
  const isDevelopment = import.meta.env.MODE === 'development';
  
  if (isDevelopment) {
    console.log('🔧 Development mode - using mock API');
    setupAxiosMock();
  } else {
    console.log('🚀 Production mode - using real API');
    cleanupAxiosMock(); // Ensure no mocks are active
  }

  // Create client (will use appropriate endpoints based on environment)
  const client = createApiClient({});
  
  try {
    const data = await client.fetchData(1);
    console.log('✅ Environment-based data:', data);
  } catch (error) {
    console.error('❌ Environment-based error:', error);
  }
};

// Example 4: Testing with mock, then switching to real API
export const testThenRealExample = async () => {
  console.log('🧪 Testing with mock first...');
  
  // Test with mock
  setupAxiosMock();
  const testClient = createApiClient({ baseURL: '/api' });
  
  try {
    const mockData = await testClient.fetchData(1);
    console.log('✅ Mock test passed:', mockData.data.topic);
    
    // Now switch to real API
    console.log('🌐 Switching to real API...');
    cleanupAxiosMock();
    
    const realClient = createApiClient({ 
      baseURL: 'https://api.example.com',
      headers: { 'X-API-Key': 'your-key' }
    });
    
    const realData = await realClient.fetchData(1);
    console.log('✅ Real API data:', realData);
    
  } catch (error) {
    console.error('❌ Error in test-then-real:', error);
  }
};

// Run examples
export const runAllExamples = async () => {
  await mockApiExample();
  await environmentBasedExample();
  await testThenRealExample();
  // Note: realApiExample() would need a real API endpoint
};