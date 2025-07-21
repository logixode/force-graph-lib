# Organized API & Mock Implementation

A well-structured API client and mock system using `axios-mock-adapter` for testing and development.

## 📁 Directory Structure

```
src/
├── api/                    # Real API client
│   ├── apiClient.ts       # Main API client class
│   └── index.ts           # API module exports
├── mock/                   # Mock implementation
│   ├── axiosMock.ts       # Axios mock adapter setup
│   ├── mockExample.ts     # Usage examples
│   └── index.ts           # Mock module exports
├── data/                   # Mock data
│   ├── mockData.ts        # Converted JSON data
│   └── index.ts           # Data module exports
└── examples/               # Usage examples
    └── apiUsage.ts        # Comprehensive examples
```

## Features

- ✅ **Organized Structure**: Clean separation of concerns
- ✅ **Real API Client**: Production-ready axios client with interceptors
- ✅ **Mock System**: Development/testing mock using `axios-mock-adapter`
- ✅ **TypeScript Support**: Full type safety
- ✅ **Environment Switching**: Easy development/production switching
- ✅ **Centralized Exports**: Clean module imports

## Quick Start

### 1. Using Real API Client

```typescript
import { ApiClient, createApiClient } from './src/api';

// Use default client
const client = new ApiClient();
const data = await client.fetchData(1);

// Or create custom client
const customClient = createApiClient({
  baseURL: 'https://api.example.com',
  headers: { 'X-API-Key': 'your-key' }
});
```

### 2. Using Mock API

```typescript
import { setupAxiosMock, apiClient } from './src/mock';

// Setup mock
setupAxiosMock();

// Use mocked endpoints
const data = await apiClient.fetchData(1);
```

### 3. Environment-Based Usage

```typescript
import { createApiClient } from './src/api';
import { setupAxiosMock } from './src/mock';

// Setup based on environment
if (process.env.NODE_ENV === 'development') {
  setupAxiosMock();
}

const client = createApiClient();
const data = await client.fetchData(1);
```

## Module Exports

### API Module (`src/api`)
- `ApiClient` - Main API client class
- `apiClient` - Default instance
- `createApiClient()` - Factory function
- `ApiConfig` - Configuration interface

### Mock Module (`src/mock`)
- `setupAxiosMock()` - Initialize mocking
- `cleanupAxiosMock()` - Remove mocking
- `mockApiClient` - Mock API client (renamed to avoid conflict)
- `exampleUsage()` - Usage examples

### Data Module (`src/data`)
- `mockData` - Mock data objects
- `getMockDataByPage()` - Get data by page
- `getAvailablePages()` - Get available pages

## Benefits

- 🏗️ **Well Organized**: Clear separation of API, mock, and data
- 🔄 **Easy Switching**: Simple development/production switching
- 📦 **Modular**: Import only what you need
- 🎯 **Type Safe**: Full TypeScript support
- 🚀 **Production Ready**: Real API client with interceptors
- 🧪 **Test Friendly**: Comprehensive mock system