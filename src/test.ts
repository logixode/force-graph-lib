import { ForceGraph } from '../lib/ForceGraph';
import { FullResponse, Pagination } from '../interfaces/graphResponse';
import page1 from './data/dummy/page1';

// Create a simple test function
function testForceGraph() {
  // Create a container element
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  // Create a new ForceGraph instance
  const graph = new ForceGraph(container);
  
  // Create a sample data object that matches the interface
  const sampleData: FullResponse<Pagination> = {
    ...page1
  };
  
  // Transform the data and update the graph
  const transformedData = (graph as any).transformData(sampleData);
  console.log('Transformed Data:', transformedData);
  
  // Check if the nodes and links were processed correctly
  console.log('Nodes:', transformedData.nodes.length);
  console.log('Links:', transformedData.links.length);
  
  // Clean up
  graph.destroy();
  document.body.removeChild(container);
}

// Run the test when the DOM is loaded
document.addEventListener('DOMContentLoaded', testForceGraph);