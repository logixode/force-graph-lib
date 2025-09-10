# Force Graph Library

A powerful, flexible TypeScript library for creating interactive force-directed graph visualizations with advanced features like grouping, clustering, and customizable styling.

## 🚀 Features

- **Interactive Force-Directed Graphs** - Smooth, physics-based node positioning
- **Advanced Grouping** - Visual organization of related nodes with customizable borders and labels
- **Dynamic Data Management** - Add, update, and remove nodes/links in real-time
- **TypeScript Support** - Full type safety with comprehensive interfaces
- **Performance Optimized** - Dynamic cooldown calculation and efficient rendering
- **Highly Customizable** - Extensive styling options for nodes, links, and groups
- **Event Handling** - Rich interaction capabilities with click handlers and more
- **Clustering Support** - Built-in support for node clustering algorithms
- **Directional Particles** - Animated particles along links for flow visualization

## 📋 Requirements

- Node.js 14+ or modern browser environment
- TypeScript 4.0+ (recommended)

## 🛠️ Dependencies

- `force-graph` - Core force-directed graph renderer
- `d3` - Data visualization library
- `d3-force-clustering` - Clustering algorithms

## 🎯 Quick Example

```typescript
import { ForceGraph } from '@logixode/force-graph-lib'

const container = document.getElementById('graph-container')!

const data = {
  nodes: [
    { id: '1', label: 'Node 1', color: '#ff6b6b' },
    { id: '2', label: 'Node 2', color: '#4ecdc4' },
    { id: '3', label: 'Node 3', color: '#45b7d1' },
  ],
  links: [
    { source: '1', target: '2' },
    { source: '2', target: '3' },
  ],
}

const graph = new ForceGraph(container, data, {
  width: 800,
  height: 600,
  nodeSize: 5,
  showGroups: true,
})
```

## 🚀 Getting Started

1. **Install dependencies**

   ```sh
   npm install force-graph d3 d3-force-clustering
   ```

2. **Import the library**

   ```typescript
   import { ForceGraph } from '@logixode/force-graph-lib'
   import type { GraphData } from '@logixode/force-graph-lib'
   ```

3. **Create your first graph**
   - See [Getting Started Guide](./getting-started.md) for detailed instructions
   - Check [Basic Usage](./basic-usage.md) for simple examples

## 🤝 Contributing

Built on top of excellent open-source libraries:

- [force-graph](https://github.com/vasturiano/force-graph) by @vasturiano
- [D3.js](https://d3js.org/) force simulation engine
- [d3-force-clustering](https://github.com/john-guerra/d3-force-clustering) for clustering

## 📄 License

[MIT License](https://github.com/logixode/force-graph-lib/blob/main/LICENSE)

---
