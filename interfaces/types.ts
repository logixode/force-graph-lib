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
export interface LinkData<N extends NodeData = NodeData> extends BaseLinkObject<N> {
  source: string | number | N
  target: string | number | N
  weight?: number
  color?: string
  curvature?: number
  [key: string]: any
}

// Extend GraphData from force-graph with our custom properties
export interface GraphData<N extends NodeData = NodeData, L extends LinkData<N> = LinkData<N>>
  extends BaseGraphData<N, L> {
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

export interface GraphOptions<N extends NodeData = NodeData, L extends LinkData<N> = LinkData<N>> {
  height?: number
  width?: number
  labelThreshold?: number // Ratio threshold: labels show when label_size <= node_size * threshold (default: 1.0)
  nodeSize?: number | ((node: N) => number)
  linkWidth?: number | ((link: L) => number)
  nodeLabel?: string | ((node: N) => string)
  nodeLabelColor?: string | ((node: N) => string)
  labelFontSize?: number // Font size for node labels in pixels (default: 16)
  nodeColor?: string | ((node: N) => string)
  nodeBorderColor?: string | ((node: N) => string)
  nodeBorderWidth?: number | ((node: N) => number)
  nodeGap?: number // default: -50
  linkLabel?: string | ((link: L) => string)
  nodeIcon?: string | ((node: N) => string)
  loading?: boolean
  pointerInteraction?: boolean
  keepDragPosition?: boolean
  // Link curve options
  linkCurvature?: number | string | ((link: L) => number)
  linkDirectionalParticles?: number | ((link: L) => number)
  linkDirectionalParticleSpeed?: number | ((link: L) => number)
  linkDirectionalParticleWidth?: number | ((link: L) => number)
  linkDirectionalParticleColor?: string | ((link: L) => string)

  // Render callback options
  onRenderComplete?: () => void // Called when the graph completes its first render
  onGraphUpdated?: () => void // Called when the graph completes rendering after data updates

  // Group visualization options
  showGroups?: boolean
  groupBy?: string | ((node: N) => string | undefined)
  groupBorderColor?: string | ((groupId: string) => string)
  groupBorderWidth?: number
  groupBorderOpacity?: number
  groupLabelColor?: string | ((groupId: string) => string)
  groupLabelSize?: number
  groupLabelThreshold?: number // Zoom level threshold for showing group labels

  groupPadding?: number // Padding around group boundaries

  // Engine configuration options
  cooldownTime?: number
  cooldownTicks?: number
}
