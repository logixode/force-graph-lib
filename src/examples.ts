import { 
  ForceGraph, 
  DataManager,
  CustomApiDataFetcher,
  DefaultDataTransformer
} from './index';

// Example 1: Using the default setup (same as before)
function createBasicGraph() {
  const container = document.getElementById('graph-container')!;
  
  // Create a data manager with default fetcher and transformer
  const dataManager = new DataManager();
  
  // Create the graph with the data manager
  const graph = new ForceGraph(container, { nodes: [], links: [] }, {}, dataManager);
  
  return graph;
}

// Example 2: Using custom API endpoint with authentication
function createGraphWithCustomAPI() {
  const container = document.getElementById('graph-container')!;
  
  // Create a custom fetcher for your API
  const customFetcher = new CustomApiDataFetcher(
    'https://api.yourcompany.com/graph-data',
    'your-auth-token-here',
    {
      userId: '12345',
      filter: 'active',
      // Add any other parameters your API needs
    }
  );
  
  // Use default transformer or create a custom one
  const transformer = new DefaultDataTransformer();
  
  // Create data manager with custom fetcher
  const dataManager = new DataManager(customFetcher, transformer);
  
  // Create the graph
  const graph = new ForceGraph(container, { nodes: [], links: [] }, {}, dataManager);
  
  return graph;
}

// Example 3: Using axios (if you have axios installed)
function createGraphWithAxios() {
  // const container = document.getElementById('graph-container')!;
  
  // You would need to install and import axios first
  // import axios from 'axios';
  
  // const axiosInstance = axios.create({
  //   baseURL: 'https://api.yourcompany.com',
  //   timeout: 10000,
  //   headers: {
  //     'Authorization': 'Bearer your-token',
  //     'Content-Type': 'application/json'
  //   }
  // });
  
  // const axiosFetcher = new AxiosDataFetcher(
  //   '/graph-data',
  //   { 'X-Custom-Header': 'value' },
  //   axiosInstance
  // );
  
  // const dataManager = new DataManager(axiosFetcher);
  // const graph = new ForceGraph(container, { nodes: [], links: [] }, {}, dataManager);
  
  // return graph;
}

// Example 4: Creating a custom data fetcher
class MyCustomDataFetcher {
  private _isFetching = false;
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async fetchNextPage(currentPage: number) {
    if (this._isFetching) return null;
    
    this._isFetching = true;
    
    try {
      // Your custom fetching logic here
      const response = await fetch(`/api/my-endpoint?page=${currentPage + 1}`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    } finally {
      this._isFetching = false;
    }
  }
  
  hasMorePages(currentPage: number, totalPages?: number): boolean {
    return totalPages ? currentPage < totalPages : true;
  }
  
  isFetching(): boolean {
    return this._isFetching;
  }
}

// Example 5: Creating a custom data transformer
class MyCustomDataTransformer {
  transformData(rawData: any, platformColors: Record<string, string>) {
    // Your custom transformation logic here
    return {
      nodes: rawData.items?.map((item: any) => ({
        id: item.id,
        label: item.name,
        color: platformColors[item.category] || platformColors.default,
        value: item.score
      })) || [],
      links: rawData.connections?.map((conn: any) => ({
        source: conn.from,
        target: conn.to,
        weight: conn.strength
      })) || [],
      currentPage: rawData.page,
      totalPages: rawData.totalPages,
      isLastPage: rawData.isLast
    };
  }
}

// Example 6: Using custom fetcher and transformer
function createGraphWithCustomComponents() {
  const container = document.getElementById('graph-container')!;
  
  const customFetcher = new MyCustomDataFetcher('your-api-key');
  const customTransformer = new MyCustomDataTransformer();
  
  const dataManager = new DataManager(customFetcher, customTransformer);
  const graph = new ForceGraph(container, { nodes: [], links: [] }, {}, dataManager);
  
  return graph;
}

// Example 7: Setting up data manager after graph creation
function createGraphAndSetupDataLater() {
  const container = document.getElementById('graph-container')!;
  
  // Create graph without data manager first
  const graph = new ForceGraph(container);
  
  // Later, set up data management
  const dataManager = new DataManager();
  graph.setDataManager(dataManager);
  
  return graph;
}

// Example 8: Updating fetcher configuration dynamically
function updateFetcherConfiguration(graph: ForceGraph) {
  const dataManager = graph.getDataManager();
  
  if (dataManager) {
    // Create a new fetcher with updated configuration
    const newFetcher = new CustomApiDataFetcher(
      'https://api.newdomain.com/data',
      'new-auth-token',
      { newParam: 'value' }
    );
    
    dataManager.setFetcher(newFetcher);
  }
}

// Usage examples:
export {
  createBasicGraph,
  createGraphWithCustomAPI,
  createGraphWithAxios,
  createGraphWithCustomComponents,
  createGraphAndSetupDataLater,
  updateFetcherConfiguration,
  MyCustomDataFetcher,
  MyCustomDataTransformer
};