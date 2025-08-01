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
  [key: string]: any
}

// Extend LinkObject from force-graph with our custom properties
export interface LinkData extends BaseLinkObject<NodeData> {
  source: string | number | NodeData
  target: string | number | NodeData
  weight?: number
  color?: string
  [key: string]: any
}

// Extend GraphData from force-graph with our custom properties
export interface GraphData extends BaseGraphData<NodeData, LinkData> {
  // currentPage?: number;
  // totalPages?: number;
  // isLastPage?: boolean;
}

export interface GraphOptions {
  height?: number
  width?: number
  labelThreshold?: number
  layout?: 'force' | 'circlepack'
  nodeSize?: number | ((node: NodeData) => number)
  linkWidth?: number | ((link: LinkData) => number)
  nodeLabel?: string | ((node: NodeData) => string)
  nodeColor?: string | ((node: NodeData) => string)
  linkLabel?: string | ((link: LinkData) => string)
  nodeIcon?: string | ((node: NodeData) => string)
  cluster?: (node: NodeData) => boolean | undefined | null
  collide?: (node: NodeData) => number
  loading?: boolean
  keepDragPosition?: boolean
  nodeClickHandler?: (node: NodeData) => void
}
