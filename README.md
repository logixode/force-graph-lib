# Force Graph Library

A TypeScript library for creating interactive force-directed graphs with advanced features and optimizations for handling large datasets.

## Features

- 🎯 Dynamic label threshold control
- 🔄 Multiple layout algorithms (Force-directed and Circle Pack)
- 🎨 Customizable styling for nodes and edges
- 📊 Efficient handling of large datasets
- 🔄 Pagination support for incremental data loading
- 🔄 Graph refresh and reset capabilities
- ⚡ Non-blocking calculations using Web Workers

## Installation

```bash
npm install force-graph-lib
```

## Usage

```typescript
import { ForceGraph } from 'force-graph-lib'

// Initialize the graph
const container = document.getElementById('graph-container')
const graph = new ForceGraph(
  container,
  {
    nodes: [
      { id: '1', name: 'Node 1' },
      { id: '2', name: 'Node 2' },
    ],
    links: [{ source: '1', target: '2' }],
  },
  {
    labelThreshold: 1.2,
    nodeSize: (node) => node.size || 5,
    nodeLabel: (node) => node.name,
    nodeIcon: '●',
  },
)

// Add more data incrementally
graph.addData({
  nodes: [{ id: '3', name: 'Node 3' }],
  links: [{ source: '2', target: '3' }],
})

// Change layout
graph.setLayout('circlepack')

// Update label threshold
graph.setLabelThreshold(1.5)

// Refresh or reset the graph
graph.refreshGraph()
graph.resetGraph()

// Check loading state
console.log(graph.isLoading())

// Clean up
graph.destroy()
```

## API Reference

### Constructor

```typescript
new ForceGraph(container: HTMLElement, data: GraphData, options?: GraphOptions)
```

### GraphData Interface

```typescript
interface GraphData {
  nodes: Array<{
    id: string
    [key: string]: any
  }>
  links: Array<{
    source: string
    target: string
    [key: string]: any
  }>
}
```

### GraphOptions Interface

```typescript
interface GraphOptions {
  labelThreshold?: number
  layout?: 'force' | 'circlepack'
  nodeSize?: number | ((node: any) => number)
  linkWidth?: number | ((link: any) => number)
  nodeLabel?: string | ((node: any) => string)
  linkLabel?: string | ((link: any) => string)
  nodeIcon?: string | ((node: any) => string)
}
```

### Methods

- `addData(newData: GraphData)`: Add new nodes and edges to the graph
- `setLayout(layout: 'force' | 'circlepack')`: Change the graph layout algorithm
- `setLabelThreshold(threshold: number)`: Set the zoom threshold for showing labels
- `updateStyles(options: Partial<GraphOptions>)`: Update graph styling options
- `refreshGraph()`: Refresh the graph with current data
- `resetGraph()`: Reset the graph to its initial state
- `isLoading()`: Check if the graph is currently calculating layout
- `destroy()`: Clean up resources and remove the graph

## License

MIT
