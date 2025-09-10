---
outline: deep
---

# API Reference

Complete reference for the TypeScript interfaces and data structures used in the Force Graph Library.

### Constructor

```typescript
constructor(
  container: HTMLElement,
  initialData: GraphData = { nodes: [], links: [] },
  options: GraphOptions = {}
)
```

**Parameters:**

- `container`: HTML element where the graph will be rendered
- `initialData`: Initial graph data (optional)
- `options`: Configuration options (optional)

## Configuration Options

### GraphOptions Interface

| Option             | Type                           | Default              | Description                              |
| ------------------ | ------------------------------ | -------------------- | ---------------------------------------- |
| `width`            | `number`                       | `800`                | Graph canvas width                       |
| `height`           | `number`                       | `400`                | Graph canvas height                      |
| `labelThreshold`   | `number`                       | `1.5`                | Minimum zoom level to show node labels   |
| `nodeSize`         | `number \| function`           | `1`                  | Node radius or function returning radius |
| `nodeColor`        | `string \| function`           | `undefined`          | Node fill color                          |
| `nodeBorderColor`  | `string \| function`           | `'#333'`             | Node border color                        |
| `nodeBorderWidth`  | `number \| function`           | `0`                  | Node border width                        |
| `nodeLabel`        | `string \| function`           | Node `label` or `id` | Node label text                          |
| `nodeLabelColor`   | `string \| function`           | `'#555'`             | Node label color                         |
| `linkWidth`        | `number \| function`           | `1`                  | Link stroke width                        |
| `linkCurvature`    | `number \| string \| function` | `0`                  | Link curvature amount                    |
| `keepDragPosition` | `boolean`                      | `false`              | Fix nodes after dragging                 |
| `nodeClickHandler` | `function`                     | `undefined`          | Node click event handler                 |
| `cluster`          | `function`                     | `undefined`          | Clustering function                      |
| `collide`          | `function`                     | `undefined`          | Collision detection function             |

### Link Directional Particles

| Option                         | Type                 | Default  | Description                            |
| ------------------------------ | -------------------- | -------- | -------------------------------------- |
| `linkDirectionalParticles`     | `number \| function` | `0`      | Number of particles moving along links |
| `linkDirectionalParticleSpeed` | `number \| function` | `0`      | Speed of directional particles         |
| `linkDirectionalParticleWidth` | `number \| function` | `0`      | Width of directional particles         |
| `linkDirectionalParticleColor` | `string \| function` | `'#aaa'` | Color of directional particles         |

### Group Visualization Options

| Option                | Type                 | Default   | Description                            |
| --------------------- | -------------------- | --------- | -------------------------------------- |
| `showGroups`          | `boolean`            | `false`   | Enable group visualization             |
| `groupBy`             | `string \| function` | `'topic'` | Property or function to group nodes by |
| `groupBorderColor`    | `string \| function` | `'#666'`  | Group border color                     |
| `groupBorderWidth`    | `number`             | `2`       | Group border width                     |
| `groupBorderOpacity`  | `number`             | `0.3`     | Group border opacity                   |
| `groupLabelColor`     | `string \| function` | `'#333'`  | Group label color                      |
| `groupLabelSize`      | `number`             | `16`      | Group label font size                  |
| `groupLabelThreshold` | `number`             | `0.8`     | Zoom level threshold for group labels  |
| `groupPadding`        | `number`             | `20`      | Padding around group boundaries        |

## Core Interfaces

### GraphData Interface

The main data structure that contains all graph information:

```typescript
import type { NodeData, LinkData } from '@logixode/force-graph-lib'

interface GraphData {
  nodes: NodeData[]
  links: LinkData[]
}
```

**Example:**

```typescript
const graphData: GraphData = {
  nodes: [
    { id: '1', label: 'Node 1' },
    { id: '2', label: 'Node 2' },
  ],
  links: [{ source: '1', target: '2' }],
}
```

## NodeData Interface

Represents individual nodes/vertices in the graph.

### Required Properties

| Property | Type               | Description                    |
| -------- | ------------------ | ------------------------------ |
| `id`     | `string \| number` | Unique identifier for the node |

### Standard Properties

| Property   | Type     | Description                        | Example                    |
| ---------- | -------- | ---------------------------------- | -------------------------- |
| `label`    | `string` | Display text for the node          | `"Alice Smith"`            |
| `color`    | `string` | Node fill color (CSS color)        | `"#e74c3c"`, `"red"`       |
| `value`    | `number` | Numeric value for sizing/weighting | `25`                       |
| `type`     | `string` | Node category/classification       | `"user"`, `"admin"`        |
| `topic`    | `string` | Grouping category                  | `"engineering"`, `"sales"` |
| `platform` | `string` | Platform identifier                | `"web"`, `"mobile"`        |

### Position Properties

| Property | Type     | Description                      |
| -------- | -------- | -------------------------------- |
| `x`      | `number` | Current X coordinate             |
| `y`      | `number` | Current Y coordinate             |
| `fx`     | `number` | Fixed X position (stops physics) |
| `fy`     | `number` | Fixed Y position (stops physics) |

### Complete NodeData Example

```typescript
const nodeExample: NodeData = {
  id: 'user_123',
  label: 'Alice Smith',
  color: '#3498db',
  value: 85,
  type: 'admin',
  topic: 'engineering',
  platform: 'web',

  // Position (usually set by physics engine)
  x: 150.5,
  y: 200.3,
}
```

## LinkData Interface

Represents connections/edges between nodes.

### Required Properties

| Property | Type                           | Description           |
| -------- | ------------------------------ | --------------------- |
| `source` | `string \| number \| NodeData` | Source node reference |
| `target` | `string \| number \| NodeData` | Target node reference |

### Standard Properties

| Property    | Type     | Description                      | Example     |
| ----------- | -------- | -------------------------------- | ----------- |
| `weight`    | `number` | Connection strength/importance   | `3.5`       |
| `color`     | `string` | Link color (CSS color)           | `"#34495e"` |
| `curvature` | `number` | Link curve amount (0 = straight) | `0.2`       |

### Complete LinkData Example

```typescript
const linkExample: LinkData = {
  source: 'user_123', // Can be ID string
  target: 'user_456', // Can be ID string
  // source: nodeObject,  // Or direct node reference

  weight: 4.2,
  color: '#e74c3c',
  curvature: 0.15,
}
```

### Link Source/Target Flexibility

Links can reference nodes in multiple ways:

```typescript
// By ID (most common)
const linkById: LinkData = {
  source: 'node1',
  target: 'node2',
}

// By numeric ID
const linkByNumericId: LinkData = {
  source: 1,
  target: 2,
}

// By direct node reference
const node1: NodeData = { id: 'node1', label: 'First' }
const node2: NodeData = { id: 'node2', label: 'Second' }

const linkByReference: LinkData = {
  source: node1,
  target: node2,
}
```

## Example Data Usage

### Hierarchical Data

```typescript
// Organization chart data
const orgData: GraphData = {
  nodes: [
    {
      id: 'ceo',
      label: 'CEO',
      type: 'executive',
      level: 1,
      color: '#c0392b',
    },
    {
      id: 'cto',
      label: 'CTO',
      type: 'executive',
      level: 2,
      color: '#8e44ad',
      reportsTo: 'ceo',
    },
    {
      id: 'dev1',
      label: 'Senior Dev',
      type: 'developer',
      level: 3,
      color: '#3498db',
      reportsTo: 'cto',
    },
  ],
  links: [
    { source: 'ceo', target: 'cto', type: 'reports_to' },
    { source: 'cto', target: 'dev1', type: 'manages' },
  ],
}
```

### Network Analysis Data

```typescript
// Social network data
const socialData: GraphData = {
  nodes: [
    {
      id: 'alice',
      label: 'Alice',
      type: 'person',
      topic: 'friends',

      // Social metrics
      connections: 45,
      influence: 8.2,
      activity: 'high',

      // Demographics
      age: 28,
      location: 'San Francisco',
      interests: ['tech', 'music', 'travel'],
    },
    {
      id: 'bob',
      label: 'Bob',
      type: 'person',
      topic: 'friends',

      connections: 23,
      influence: 5.7,
      activity: 'medium',

      age: 32,
      location: 'New York',
      interests: ['sports', 'cooking'],
    },
  ],
  links: [
    {
      source: 'alice',
      target: 'bob',

      // Relationship data
      type: 'friendship',
      strength: 0.8,
      duration: 5, // years
      interactions: 150, // monthly

      // Communication channels
      channels: ['text', 'social_media', 'in_person'],
      lastContact: '2024-01-14',
    },
  ],
}
```

### Time-Series Data

```typescript
// Data with temporal aspects
interface TimeseriesNodeData extends NodeData {
  timestamps: Array<{
    date: string
    value: number
    status: string
  }>
  createdAt: string
  updatedAt: string
}

const timeseriesData: GraphData = {
  nodes: [
    {
      id: 'server1',
      label: 'Web Server',
      type: 'infrastructure',

      timestamps: [
        { date: '2024-01-01', value: 85, status: 'healthy' },
        { date: '2024-01-02', value: 92, status: 'warning' },
        { date: '2024-01-03', value: 78, status: 'healthy' },
      ],

      createdAt: '2023-06-15',
      updatedAt: '2024-01-03',
    } as TimeseriesNodeData,
  ],
  links: [
    {
      source: 'server1',
      target: 'database1',

      // Connection metrics over time
      latencyHistory: [
        { date: '2024-01-01', latency: 12 },
        { date: '2024-01-02', latency: 15 },
        { date: '2024-01-03', latency: 11 },
      ],

      currentLatency: 11,
      averageLatency: 12.7,
    },
  ],
}
```
