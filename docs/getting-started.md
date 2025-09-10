# Getting Started

This guide will help you install and set up the Force Graph Library in your project.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 14+** or a modern browser environment
- **TypeScript 4.0+** (recommended for full type support)
- A bundler like Webpack, Vite, or Rollup (for web applications)

## Installation

### 1. Install Core Dependencies

```sh
npm install @logixode/force-graph-lib
```

### 2. Import the Library

```typescript
import { ForceGraph } from '@logixode/force-graph-lib'
import type { GraphData, NodeData, LinkData } from '@logixode/force-graph-lib'
```

### 3. Prepare Your Data

```typescript
const data: GraphData = {
  nodes: [
    {
      id: 'node1',
      label: 'First Node',
      color: '#ff6b6b',
      value: 10,
    },
    {
      id: 'node2',
      label: 'Second Node',
      color: '#4ecdc4',
      value: 15,
    },
    {
      id: 'node3',
      label: 'Third Node',
      color: '#45b7d1',
      value: 20,
    },
  ],
  links: [
    {
      source: 'node1',
      target: 'node2',
      weight: 1,
    },
    {
      source: 'node2',
      target: 'node3',
      weight: 2,
    },
  ],
}
```

### 4. Create the Graph

```html
<!-- prepare the container in ur html -->
<div id="graph-container" />
```

```typescript
// Get the container element
const container = document.getElementById('graph-container')

if (!container) {
  throw new Error('Container element not found')
}

// Create graph instance
const graph = new ForceGraph(container, data, {
  width: 800,
  height: 600,
  nodeSize: 6,
  labelThreshold: 1.5,
  nodeClickHandler: (node) => {
    console.log('Clicked node:', node.label)
  },
})
```

## Complete Example

Here's a complete working example:

```typescript
import { ForceGraph } from '@logixode/force-graph-lib'
import type { GraphData } from '@logixode/force-graph-lib'

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('graph-container')!

  const data: GraphData = {
    nodes: [
      { id: '1', label: 'Alice', color: '#e74c3c' },
      { id: '2', label: 'Bob', color: '#3498db' },
      { id: '3', label: 'Carol', color: '#2ecc71' },
      { id: '4', label: 'Dave', color: '#f39c12' },
    ],
    links: [
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '3', target: '4' },
      { source: '4', target: '1' },
    ],
  }

  const graph = new ForceGraph(container, data, {
    width: container.clientWidth,
    height: container.clientHeight,
    nodeSize: 8,
    nodeBorderWidth: 2,
    nodeBorderColor: '#333',
    linkWidth: 2,
    labelThreshold: 1.2,
  })

  // Handle window resize
  window.addEventListener('resize', () => {
    graph.setOptions({
      width: container.clientWidth,
      height: container.clientHeight,
    })
  })
})
```

## Verification

If everything is set up correctly, you should see:

- A graph with 4 connected nodes
- Nodes with different colors
- Interactive dragging and zooming
- Labels appearing when you zoom in

## Common Setup Issues

**Container not found**: Ensure the HTML element exists before creating the graph \
**Import errors**: Check file paths and ensure all dependencies are installed \
**TypeScript errors**: Verify your tsconfig.json includes the necessary files \
**Blank graph**: Check browser console for errors and verify data format

## Next Steps

Now that you have a basic graph running:

1. **Explore styling options** - See [Configuration Guide](./configuration.md)
2. **Learn about data structures** - Check [Data Structures](./data-structures.md)
3. **Try advanced features** - Visit [Basic Usage](./basic-usage.md) for more examples
