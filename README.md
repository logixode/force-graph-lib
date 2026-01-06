# Force Graph Library

A TypeScript library for creating interactive force-directed graphs with advanced features and optimizations for handling large datasets.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage in TypeScript](#usage-in-typescript)
- [Usage in Vue.js](#usage-in-vuejs)
- [Detail for Types](#detail-for-types)
- [API Reference](#api-reference)
- [License](#license)

## Features

- 🎨 Highly customizable styling for nodes, links, and groups.
- 🎯 Dynamic label visibility control based on zoom level.
- 🔄 Incremental data loading and dynamic data updates.
- ⚙️ Fine-grained control over the force simulation (e.g., collision, clustering).
- 🚀 Optimized for large datasets with features like dynamic cooldown time.
- 🖼️ Group visualization with borders and labels.
- 🔍 Zoom and pan, including programmatic focus on specific nodes or coordinates.
- ✋ Persist node positions after dragging.
- 💧 Responsive design that adapts to container size changes.
- 🔧 Methods to query and manipulate graph data and state.
- 🧹 Full cleanup and resource destruction.

## Installation

```bash
npm install @logixode/force-graph-lib
```

## Usage in TypeScript

Here's an example of how to use the library in a TypeScript project.

**HTML File**

```html
<div id="graph-container" style="width: 800px; height: 600px; border: 1px solid #ccc;"></div>
```

**TypeScript File (`main.ts`)**

```typescript
import { ForceGraph } from '@logixode/force-graph-lib'
import type { GraphData, GraphOptions, NodeData } from '@logixode/force-graph-lib'

// 1. Get the container element
const container = document.getElementById('graph-container') as HTMLElement

// 2. Define initial data
const initialData: GraphData = {
  nodes: [
    { id: '1', label: 'Topic Node', type: 'topic' },
    { id: '2', label: 'Post A', type: 'post' },
    { id: '3', label: 'Post B', type: 'post' },
  ],
  links: [
    { source: '1', target: '2' },
    { source: '1', target: '3' },
  ],
}

// 3. Define graph options
const options: GraphOptions = {
  width: container.clientWidth,
  height: container.clientHeight,
  keepDragPosition: true,
  labelThreshold: 1.2,

  // Node styling
  nodeSize: (node: NodeData) => (node.type === 'topic' ? 5 : 2),
  nodeLabel: (node: NodeData) => node.label as string,
  nodeColor: (node: NodeData) => (node.type === 'topic' ? '#FA8F21' : '#1877F2'),
  nodeBorderWidth: 0.5,
  nodeBorderColor: 'white',

  // Link styling
  linkWidth: 0.4,
  linkCurvature: 0.1,

  // Simulation forces
  collide: (node: NodeData) => (node.type === 'topic' ? 15 : 5),
  cluster: (node: NodeData) => node.type, // Group nodes by their 'type'
}

// 4. Initialize the graph
const graph = new ForceGraph(container, initialData, options)

// 5. Interact with the graph
setTimeout(() => {
  const newData = {
    nodes: [
      { id: '4', label: 'Post C', type: 'post' },
      { id: '5', label: 'Repost', type: 'repost' },
    ],
    links: [
      { source: '2', target: '4' },
      { source: '1', target: '5' },
    ],
  }
  graph.addData(newData)
  graph.focusPosition({ id: '4' })
}, 2000)

// Handle window resizing
window.addEventListener('resize', () => {
  graph.setOptions({
    width: container.clientWidth,
    height: container.clientHeight,
  })
  graph.reinitialize()
})
```

## Usage in Vue.js

Here is a basic example of integrating the library within a Vue 3 component using the Composition API.

```vue
<template>
  <div ref="graphContainer" style="width: 100%; height: 600px;"></div>
</template>

<script setup lang="ts">
import { ref, graphContainer, onMounted, onUnmounted, watch } from 'vue'
import { ForceGraph } from '@logixode/force-graph-lib'
import type { GraphData, GraphOptions, NodeData } from '@logixode/force-graph-lib'
import { useElementSize } from '@vueuse/core'

const graphContainer = useTemplateRef('graphContainer')
const graph = ref<ForceGraph | null>(null)
const { width, height } = useElementSize(graphContainer)

const initialData: GraphData = {
  nodes: [
    { id: 'a', label: 'A', sentiment: 'positive' },
    { id: 'b', label: 'B', sentiment: 'negative' },
    { id: 'c', label: 'C', sentiment: 'positive' },
  ],
  links: [
    { source: 'a', target: 'b' },
    { source: 'c', target: 'a' },
  ],
}

const graphOptions: GraphOptions = {
  keepDragPosition: true,
  nodeSize: 3,
  nodeLabel: (node: NodeData) => node.label as string,
  nodeColor: (node: NodeData) => (node.sentiment === 'positive' ? 'green' : 'red'),
  cluster: (node: NodeData) => node.sentiment,
}

onMounted(() => {
  if (graphContainer.value) {
    graph.value = new ForceGraph(graphContainer.value, initialData, {
      ...graphOptions,
      width: width.value,
      height: height.value,
    })
  }
})

onUnmounted(() => {
  graph.value?.destroy()
})

// Make graph responsive
watch([width, height], (newSize, oldSize) => {
  if (
    graph.value &&
    (Math.abs(newSize[0] - oldSize[0]) > 10 || Math.abs(newSize[1] - oldSize[1]) > 10)
  ) {
    graph.value.setOptions({ width: width.value, height: height.value })
    graph.value.reinitialize()
  }
})
</script>
```

## Detail for Types

### `GraphData` Interface

```typescript
interface GraphData {
  nodes: Array<{
    id: string | number
    [key: string]: any
  }>
  links: Array<{
    source: string | number
    target: string | number
    [key: string]: any
  }>
}
```

### `GraphOptions` Interface

```typescript
interface GraphOptions {
  width?: number
  height?: number
  labelThreshold?: number
  keepDragPosition?: boolean

  // Node Styling
  nodeSize?: number | ((node: NodeData) => number)
  nodeLabel?: string | ((node: NodeData) => string)
  nodeLabelColor?: string | ((node: NodeData) => string)
  nodeColor?: string | ((node: NodeData) => string)
  nodeBorderColor?: string | ((node: NodeData) => string)
  nodeBorderWidth?: number | ((node: NodeData) => number)

  // Link Styling
  linkWidth?: number | ((link: LinkData) => number)
  linkCurvature?: number | 'curvature' | ((link: LinkData) => number)
  linkDirectionalParticles?: number | ((link: LinkData) => number)
  linkDirectionalParticleSpeed?: number | ((link: LinkData) => number)
  linkDirectionalParticleWidth?: number | ((link: LinkData) => number)
  linkDirectionalParticleColor?: string | ((link: LinkData) => string)

  // Simulation
  cluster?: (node: NodeData) => any
  collide?: (node: NodeData) => number

  // Grouping
  showGroups?: boolean
  groupBy?: string | ((node: NodeData) => string | undefined)
  groupBorderColor?: string | ((groupId: string) => string)
  groupBorderWidth?: number
  groupBorderOpacity?: number
  groupLabelColor?: string | ((groupId: string) => string)
  groupLabelSize?: number
  groupLabelThreshold?: number
  groupPadding?: number
}
```

## API Reference

### Constructor

```typescript
new ForceGraph(container: HTMLElement, data: GraphData, options?: GraphOptions)
```

### Methods

#### Data Management

- `addData(newData: GraphData): Promise<void>`: Asynchronously adds new nodes and links, avoiding duplicates.
- `updateData(data: GraphData): void`: Merges new data with existing data. (Prefer `addData` for incremental updates).
- `graphData(data: GraphData): ForceGraph`: Replaces the entire graph data and re-renders.
- `updateNode(id: string | number, updates: Partial<NodeData>): boolean`: Updates properties of a single node.
- `removeNode(id: string | number): boolean`: Removes a node and its associated links.
- `reset()`: Clears all graph data and re-initializes the component.

#### Getters

- `getData(): GraphData`: Returns the current graph data object.
- `getNodesData(): NodeData[]`: Returns an array of all nodes.
- `getLinksData(): LinkData[]`: Returns an array of all links.
- `getNodeById(id: string | number): NodeData | undefined`: Finds a node by its ID.
- `hasNode(id: string | number): boolean`: Checks if a node exists.
- `getDataSize(): { nodes: number; links: number }`: Returns the number of nodes and links.
- `getOptions(): GraphOptions`: Returns the current options object.

#### Rendering & Options

- `setOptions(options: Partial<GraphOptions>)`: Updates one or more options without re-initializing the entire graph.
- `setLabelThreshold(threshold: number)`: Sets the zoom level at which node labels become visible.
- `refreshGraph()`: Refreshes the graph with the current data. Useful after manual data manipulation.
- `reinitialize()`: Performs a complete re-initialization. Use when major changes like dimensions are needed.
- `applyOptions()`: Re-applies all current options to the graph.

#### Camera & View

- `focusPosition(position: { id?: string; x?: number; y?: number }): void`: Centers the view on a specific node or coordinate.

#### Grouping

- `showGroups(show: boolean): ForceGraph`: Enables or disables the group visualization.
- `setGroupBy(groupBy: string | ((node: NodeData) => string | undefined)): ForceGraph`: Sets the property or function used to group nodes.
- `setGroupOptions(options: object): ForceGraph`: Sets styling options for groups (e.g., `borderColor`, `padding`).
- `getGroups(): string[]`: Returns an array of all unique group IDs.
- `getNodesInGroup(groupId: string): NodeData[]`: Returns all nodes belonging to a specific group.

#### Lifecycle

- `destroy()`: Cleans up all resources, including the simulation and event listeners. Essential for single-page applications.

## License

MIT
