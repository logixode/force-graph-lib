import type { ForceGraph } from '@/index'
import type {
  NodeObject as BaseNodeObject,
  LinkObject as BaseLinkObject,
  GraphData as BaseGraphData,
} from 'force-graph'

// Extend NodeObject from force-graph with our custom properties
export interface NodeData extends BaseNodeObject {
  id: string | number
  x?: number
  y?: number
  fx?: number
  fy?: number
  color?: string
  value?: number
  label?: string
  platform?: string
  type?: string
  topic?: string // Added for grouping functionality
  [key: string]: any
}

// Extend LinkObject from force-graph with our custom properties
export interface LinkData extends BaseLinkObject<NodeData> {
  source: string | number | NodeData
  target: string | number | NodeData
  weight?: number
  color?: string
  curvature?: number
  [key: string]: any
}

// Extend GraphData from force-graph with our custom properties
export interface GraphData extends BaseGraphData<NodeData, LinkData> {
  // currentPage?: number;
  // totalPages?: number;
  // isLastPage?: boolean;
}
export type ForceType = 'link' | 'charge' | 'center' | 'cluster' | string
export interface ForceFn<N extends BaseNodeObject = BaseNodeObject> {
  (alpha: number): void
  initialize?: (nodes: N[], ...args: any[]) => void
  [key: string]: any
}

export interface GraphOptions {
  height?: number
  width?: number
  labelThreshold?: number // Ratio threshold: labels show when label_size <= node_size * threshold (default: 1.0)
  nodeSize?: number | ((node: NodeData) => number)
  linkWidth?: number | ((link: LinkData) => number)
  nodeLabel?: string | ((node: NodeData) => string)
  nodeLabelColor?: string | ((node: NodeData) => string)
  labelFontSize?: number // Font size for node labels in pixels (default: 16)
  nodeColor?: string | ((node: NodeData) => string)
  nodeBorderColor?: string | ((node: NodeData) => string)
  nodeBorderWidth?: number | ((node: NodeData) => number)
  nodeGap?: number // default: -50
  linkLabel?: string | ((link: LinkData) => string)
  nodeIcon?: string | ((node: NodeData) => string)
  loading?: boolean
  pointerInteraction?: boolean
  keepDragPosition?: boolean
  nodeClickHandler?: (node: NodeData) => void
  // Link curve options
  linkCurvature?: number | string | ((link: LinkData) => number)
  linkDirectionalParticles?: number | ((link: LinkData) => number)
  linkDirectionalParticleSpeed?: number | ((link: LinkData) => number)
  linkDirectionalParticleWidth?: number | ((link: LinkData) => number)
  linkDirectionalParticleColor?: string | ((link: LinkData) => string)

  // Group visualization options
  showGroups?: boolean
  groupBy?: string | ((node: NodeData) => string | undefined)
  groupBorderColor?: string | ((groupId: string) => string)
  groupBorderWidth?: number
  groupBorderOpacity?: number
  groupLabelColor?: string | ((groupId: string) => string)
  groupLabelSize?: number
  groupLabelThreshold?: number // Zoom level threshold for showing group labels
  groupPadding?: number // Padding around group boundaries
}
