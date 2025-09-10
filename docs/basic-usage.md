# Basic Usage

Learn the fundamental concepts and patterns for using the Force Graph Library effectively.

## Core Concepts

### Graph Structure

Every graph consists of two main components:

- **Nodes**: Individual points/entities in your graph
- **Links**: Connections between nodes

### Basic Workflow

1. Prepare your data in the correct format
2. Create a container element
3. Initialize the ForceGraph instance
4. Optionally configure styling and behavior

## Simple Examples

### Minimal Graph

The simplest possible graph with just two connected nodes:

```typescript
import { ForceGraph } from '@logixode/force-graph-lib'

const container = document.getElementById('my-graph')!

const simpleData = {
  nodes: [
    { id: 'A', label: 'Node A' },
    { id: 'B', label: 'Node B' },
  ],
  links: [{ source: 'A', target: 'B' }],
}

const graph = new ForceGraph(container, simpleData)
```

### Styled Graph

Adding colors, sizes, and custom styling:

```typescript
const styledData = {
  nodes: [
    {
      id: 'user1',
      label: 'Alice',
      color: '#e74c3c',
      value: 25,
    },
    {
      id: 'user2',
      label: 'Bob',
      color: '#3498db',
      value: 15,
    },
    {
      id: 'user3',
      label: 'Carol',
      color: '#2ecc71',
      value: 30,
    },
  ],
  links: [
    {
      source: 'user1',
      target: 'user2',
      weight: 2,
      color: '#34495e',
    },
    {
      source: 'user2',
      target: 'user3',
      weight: 3,
      color: '#9b59b6',
    },
  ],
}

const graph = new ForceGraph(container, styledData, {
  width: 800,
  height: 600,
  nodeSize: (node) => Math.sqrt(node.value || 1) * 3,
  nodeColor: (node) => node.color || '#95a5a6',
  linkWidth: (link) => (link.weight || 1) * 2,
  nodeBorderWidth: 2,
  nodeBorderColor: '#2c3e50',
})
```

## Dynamic Data Updates

### Adding New Data

```typescript
// Create initial graph
const graph = new ForceGraph(container, initialData)

// Add more nodes and links later
const additionalData = {
  nodes: [
    { id: 'new1', label: 'New Node 1', color: '#f39c12' },
    { id: 'new2', label: 'New Node 2', color: '#e67e22' },
  ],
  links: [
    { source: 'user1', target: 'new1' },
    { source: 'new1', target: 'new2' },
  ],
}

// Method 1: Update existing data
graph.updateData(additionalData)

// Method 2: Add to existing data
await graph.addData(additionalData)
```

### Updating Individual Nodes

```typescript
// Change a node's appearance
graph.updateNode('user1', {
  color: '#ff0000',
  label: 'Alice (Updated)',
  value: 50,
})

// Remove a node and its connections
graph.removeNode('user2')
```

## Interactive Features

### Click Handling

```typescript
const graph = new ForceGraph(container, data, {
  nodeClickHandler: (node) => {
    console.log('Clicked:', node.label)

    // Update the clicked node
    graph.updateNode(node.id, {
      color: '#ff6b6b',
      label: `${node.label} (Clicked!)`,
    })

    // Focus on the node
    graph.focusPosition({ id: node.id })
  },
})
```

### Maintaining Drag Positions

```typescript
const graph = new ForceGraph(container, data, {
  keepDragPosition: true, // Nodes stay where dragged
  nodeClickHandler: (node) => {
    // Double-click to release fixed position
    if (node.fx !== undefined) {
      graph.updateNode(node.id, { fx: undefined, fy: undefined })
    }
  },
})
```

## Customization Patterns

### Conditional Styling

Style nodes differently based on their properties:

```typescript
const graph = new ForceGraph(container, data, {
  nodeColor: (node) => {
    if (node.type === 'important') return '#e74c3c'
    if (node.value > 20) return '#f39c12'
    return '#95a5a6'
  },

  nodeSize: (node) => {
    const baseSize = 4
    if (node.type === 'important') return baseSize * 2
    return baseSize + (node.value || 0) * 0.1
  },

  nodeBorderWidth: (node) => {
    return node.type === 'important' ? 3 : 1
  },
})
```

### Dynamic Link Styling

```typescript
const graph = new ForceGraph(container, data, {
  linkWidth: (link) => {
    return Math.max(1, (link.weight || 1) * 2)
  },

  linkCurvature: (link) => {
    // Curve important connections more
    return link.type === 'important' ? 0.3 : 0.1
  },

  // Add animated particles for flow visualization
  linkDirectionalParticles: (link) => {
    return link.showFlow ? 2 : 0
  },

  linkDirectionalParticleSpeed: 0.01,
})
```

## Responsive Design

### Auto-resize Graph

```typescript
function createResponsiveGraph(containerId: string, data: GraphData) {
  const container = document.getElementById(containerId)!

  const graph = new ForceGraph(container, data, {
    width: container.clientWidth,
    height: container.clientHeight,
  })

  // Handle window resize
  const resizeHandler = () => {
    graph.setOptions({
      width: container.clientWidth,
      height: container.clientHeight,
    })
  }

  window.addEventListener('resize', resizeHandler)

  return {
    graph,
    cleanup: () => {
      window.removeEventListener('resize', resizeHandler)
      graph.destroy()
    },
  }
}

// Usage
const { graph, cleanup } = createResponsiveGraph('my-graph', data)

// Clean up when done
// cleanup()
```

### Mobile Optimization

```typescript
const isMobile = window.innerWidth < 768

const mobileOptions = {
  labelThreshold: isMobile ? 2.5 : 1.5, // Higher threshold on mobile
  nodeSize: isMobile ? 8 : 6, // Larger nodes for touch
  linkWidth: isMobile ? 3 : 2, // Thicker links
  // Disable some features for performance
  linkDirectionalParticles: isMobile ? 0 : 2,
}

const graph = new ForceGraph(container, data, mobileOptions)
```

## Data Loading Patterns

### Async Data Loading

```typescript
class GraphManager {
  private graph: ForceGraph

  constructor(container: HTMLElement) {
    // Start with empty graph
    this.graph = new ForceGraph(container, { nodes: [], links: [] })
  }

  async loadFromAPI(endpoint: string) {
    try {
      const response = await fetch(endpoint)
      const data = await response.json()

      // Validate data structure
      if (!data.nodes || !data.links) {
        throw new Error('Invalid data format')
      }

      // Load the data
      this.graph.graphData(data)

      return data
    } catch (error) {
      console.error('Failed to load graph data:', error)
      throw error
    }
  }

  async loadIncrementally(endpoints: string[]) {
    for (const endpoint of endpoints) {
      const data = await this.loadFromAPI(endpoint)
      await this.graph.addData(data)

      // Small delay for smooth animation
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
}

// Usage
const manager = new GraphManager(container)
await manager.loadFromAPI('/api/graph-data')
```

### Filtering and Search

```typescript
class FilterableGraph {
  private originalData: GraphData
  private graph: ForceGraph

  constructor(container: HTMLElement, data: GraphData) {
    this.originalData = data
    this.graph = new ForceGraph(container, data)
  }

  filterByType(nodeType: string) {
    const filteredNodes = this.originalData.nodes.filter((node) => node.type === nodeType)

    const nodeIds = new Set(filteredNodes.map((n) => n.id))

    const filteredLinks = this.originalData.links.filter((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source
      const targetId = typeof link.target === 'object' ? link.target.id : link.target
      return nodeIds.has(sourceId) && nodeIds.has(targetId)
    })

    this.graph.graphData({
      nodes: filteredNodes,
      links: filteredLinks,
    })
  }

  search(query: string) {
    const matchingNodes = this.originalData.nodes.filter(
      (node) =>
        node.label?.toLowerCase().includes(query.toLowerCase()) ||
        node.id.toString().toLowerCase().includes(query.toLowerCase())
    )

    // Highlight matching nodes
    matchingNodes.forEach((node) => {
      this.graph.updateNode(node.id, {
        color: '#ff6b6b',
        borderWidth: 3,
      })
    })

    // Focus on first match
    if (matchingNodes.length > 0) {
      this.graph.focusPosition({ id: matchingNodes[0].id })
    }
  }

  resetFilters() {
    this.graph.graphData(this.originalData)
  }
}
```

## Performance Tips

### Optimizing Large Graphs

```typescript
// For graphs with 1000+ nodes
const performanceOptions = {
  labelThreshold: 3.0, // Only show labels when zoomed in
  cooldownTime: 5000, // Longer stabilization time
  linkDirectionalParticles: 0, // Disable particles

  // Use collision detection sparingly
  collide: (node) => (node.type === 'important' ? 10 : 0),
}

const graph = new ForceGraph(container, largeData, performanceOptions)
```

### Memory Management

```typescript
// Clean up properly when switching views
function switchGraph(container: HTMLElement, newData: GraphData) {
  // Destroy existing graph
  if (window.currentGraph) {
    window.currentGraph.destroy()
  }

  // Create new graph
  window.currentGraph = new ForceGraph(container, newData)

  return window.currentGraph
}
```

---
