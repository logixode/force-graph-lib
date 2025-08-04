import ForceGraphRenderer from 'force-graph'
import type { LinkObject } from 'force-graph'
import * as d3 from 'd3'
import type { GraphData, GraphOptions, NodeData, LinkData } from '../../interfaces/types'
import { DataManager } from '../../interfaces/dataManager'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import d3ForceClustering from 'd3-force-clustering'

export class ForceGraph {
  private container: HTMLElement
  private graph: ForceGraphRenderer<NodeData, LinkObject<NodeData>>
  private data: GraphData = { nodes: [], links: [] }
  private nodesMap: Map<string, NodeData> = new Map()
  private options: GraphOptions
  private worker: Worker | null = null
  private isCalculating: boolean = false
  private dataManager?: DataManager

  constructor(
    container: HTMLElement,
    initialData: GraphData = { nodes: [], links: [] },
    options: GraphOptions = {},
    dataManager?: DataManager,
  ) {
    this.container = container
    this.data = initialData
    this.graph = new ForceGraphRenderer(this.container)

    // Initialize nodesMap with initial data for fast lookups
    this.nodesMap = new Map()
    initialData.nodes.forEach((node) => {
      this.nodesMap.set(node.id.toString(), node)
    })

    this.options = {
      labelThreshold: 1.5,
      layout: 'force',
      ...options,
    }

    // Set up data manager if provided
    if (dataManager) {
      this.dataManager = dataManager
    }

    this.initGraph()
  }

  private initGraph() {
    this.graph
      .width(this.options.width ?? 800)
      .height(this.options.height ?? 400)
      .onNodeClick((node) => {
        console.log('Node clicked:', node)

        // Call custom node click handler if provided
        if (this.options.nodeClickHandler) {
          this.options.nodeClickHandler(node)
        }

        this.focusPosition({ x: node.x, y: node.y })
      })
      // .d3AlphaDecay(0)
      // .d3VelocityDecay(0.08)
      // .cooldownTicks(0)
      .cooldownTime(3000)
      .d3Force(
        'cluster',
        this.options.cluster ? d3ForceClustering().clusterId(this.options.cluster) : null,
      )
      // Force-directed layout with no collision
      .d3Force(
        'collide',
        d3.forceCollide<NodeData>().radius((node) => {
          if (this.options.collide) {
            return this.options.collide(node)
          }

          const isTopic = node.type === 'topic' || !node.type

          // if (isTopic) console.log(node)

          return isTopic ? this.getNodeSize(node) * 7 : this.getNodeSize(node) * 3
        }),
      )
    // size calculated by node size + math(n) for better performance on first render
    // large size of graph consuming high memory when animating first render
    // so when render large graph, less cooldown time == quick display == high memory usage
    // more cooldown time == slow animating display == lower memory usage

    if (this.options.keepDragPosition) {
      this.graph.onNodeDragEnd((node) => {
        node.fx = node.x
        node.fy = node.y
      })
    }

    // Always render nodes with color and labels
    this.graph.nodeCanvasObject((node, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const size = this.getNodeSize(node) * 2
      ctx.beginPath()
      ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI)
      ctx.fillStyle = this.getNodeColor(node)
      ctx.fill()

      const label = this.getNodeLabel(node)
      if (label && globalScale >= (this.options.labelThreshold || 1.5)) {
        ctx.font = `${Math.max(size, 8)}px Arial`
        ctx.fillStyle = '#000'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, node.x || 0, (node.y || 0) + size + 2)
      }
    })

    // Set initial data
    this.graph.graphData(this.data)

    // Apply initial options
    this.applyOptions()
    // this.refresh();

    // fit to canvas when engine stops
    this.graph.onEngineStop(() => this.graph.zoomToFit(400))
    // setTimeout(() => {

    //   this.graph.cooldownTicks(undefined);
    // }, 100);
  }
  public d3() {
    return this.graph
  }

  public focusPosition(nodeData: { id?: string; x?: number; y?: number } = {}) {
    if (!Object.values(nodeData).length) return

    if (nodeData.id) {
      const { x, y } = this.nodesMap.get(nodeData.id) ?? { x: 0, y: 0 }
      if (x && y) {
        nodeData = { x, y }
      }
    }

    if (nodeData) {
      this.graph.centerAt(nodeData.x, nodeData.y, 1000)
      this.graph.zoom(8, 2000)
    }
  }

  private applyOptions() {
    if (this.options.layout === 'circlepack') {
      this.applyCirclePackLayout()
    } else {
      // Default force-directed layout
      this.graph
        .d3Force('charge', d3.forceManyBody().strength(-100))
        .d3Force(
          'link',
          d3
            .forceLink()
            .id((d) => d.index ?? '')
            .distance(30),
        )
        .d3Force('center', d3.forceCenter())
    }
  }

  private applyCirclePackLayout() {
    // Implement circle pack layout
    this.graph.d3Force('charge', d3.forceManyBody<NodeData>().strength(0))
    this.graph.d3Force('link', null)
    this.graph.d3Force('center', null)
    this.graph.d3Force('x', d3.forceX<NodeData>().strength(0.1))
    this.graph.d3Force('y', d3.forceY<NodeData>().strength(0.1))
  }

  private getNodeSize(node: NodeData): number {
    if (typeof this.options.nodeSize === 'function') {
      return this.options.nodeSize(node) || node.marker?.radius
    }
    return this.options.nodeSize || node.marker?.radius || 1
  }

  private getNodeLabel(node: NodeData): string {
    if (typeof this.options.nodeLabel === 'function') {
      return this.options.nodeLabel(node)
    }

    const scale = this.graph.zoom()
    if (scale < (this.options.labelThreshold || 1.5)) return ''

    return node.label || (node.id as string)
  }

  public updateData(data: GraphData): void {
    // Merge new data with existing data
    const existingNodeIds = new Set(this.data.nodes.map((node) => node.id.toString()))
    const newNodes = data.nodes.filter((node) => !existingNodeIds.has(node.id.toString()))

    // Add new nodes to the map
    newNodes.forEach((node) => {
      this.nodesMap.set(node.id.toString(), node)
    })

    // Create a unique key for each link
    const createLinkKey = (
      source: string | number | NodeData,
      target: string | number | NodeData,
    ) => {
      const sourceId = typeof source === 'object' ? source.id : source
      const targetId = typeof target === 'object' ? target.id : target
      return `${sourceId}-${targetId}`
    }

    // Create a map of existing links
    const existingLinkKeys = new Set(
      this.data.links.map((link) => createLinkKey(link.source, link.target)),
    )

    // Filter out duplicate links
    const newLinks = data.links.filter(
      (link) => !existingLinkKeys.has(createLinkKey(link.source, link.target)),
    )

    // Update the data
    this.data = {
      nodes: [...this.data.nodes, ...newNodes],
      links: [...this.data.links, ...newLinks],
    }

    // Update the graph
    this.refresh()
    // this.graph.graphData(this.data); // same
  }

  private getNodeColor(node: NodeData): string {
    if (typeof this.options.nodeColor === 'function') {
      const color = this.options.nodeColor(node)
      if (color) return color
    }
    return node.color ?? ''
  }

  public getNodeById(id: string | number): NodeData | undefined {
    return this.nodesMap.get(id.toString())
  }

  public hasNode(id: string | number): boolean {
    return this.nodesMap.has(id.toString())
  }

  public getNodeCount(): number {
    return this.nodesMap.size
  }
  public getLinkCount(): number {
    return this.graph.graphData().links.length
  }
  public getDataSize(): { nodes: number; links: number } {
    const { nodes, links } = this.graph.graphData()
    return {
      nodes: nodes.length,
      links: links.length,
    }
  }

  public getAllNodeIds(): string[] {
    return Array.from(this.nodesMap.keys())
  }

  public updateNode(id: string | number, updates: Partial<NodeData>): boolean {
    const node = this.nodesMap.get(id.toString())
    if (node) {
      Object.assign(node, updates)
      // Update the array as well
      const nodeIndex = this.data.nodes.findIndex((n) => n.id.toString() === id.toString())
      if (nodeIndex !== -1) {
        this.data.nodes[nodeIndex] = node
      }
      this.refresh()
      return true
    }
    return false
  }

  public removeNode(id: string | number): boolean {
    const nodeId = id.toString()
    if (this.nodesMap.has(nodeId)) {
      this.nodesMap.delete(nodeId)
      // Remove from array
      this.data.nodes = this.data.nodes.filter((node) => node.id.toString() !== nodeId)
      // Remove associated links
      this.data.links = this.data.links.filter((link) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source
        const targetId = typeof link.target === 'object' ? link.target.id : link.target
        return sourceId.toString() !== nodeId && targetId.toString() !== nodeId
      })
      this.refresh()
      return true
    }
    return false
  }

  public async addData(newData: GraphData): Promise<void> {
    this.isCalculating = true

    // Add new nodes if they don't exist
    newData.nodes.forEach((node) => {
      if (!this.nodesMap.has(node.id.toString())) {
        this.nodesMap.set(node.id.toString(), node)
      }
    })

    // Create a unique key for each link
    const createLinkKey = (
      source: string | number | NodeData,
      target: string | number | NodeData,
    ) => {
      const sourceId = typeof source === 'object' ? source.id : source
      const targetId = typeof target === 'object' ? target.id : target
      return `${sourceId}-${targetId}`
    }

    const linkMap = new Map<string, LinkData>()

    // Add existing links to the map
    this.data.links.forEach((link) => {
      const key = createLinkKey(link.source, link.target)
      linkMap.set(key, link)
    })

    // Add new links if they don't exist
    newData.links.forEach((link) => {
      const key = createLinkKey(link.source, link.target)
      if (!linkMap.has(key)) {
        linkMap.set(key, link)
      }
    })

    // Update the data
    this.data = {
      nodes: Array.from(this.nodesMap.values()),
      links: Array.from(linkMap.values()),
    }

    // Update the graph
    this.graph.graphData(this.data)

    // Fallback to setTimeout to avoid blocking UI
    setTimeout(() => {
      this.isCalculating = false
    }, 500)
  }

  public setLayout(layout: 'force' | 'circlepack') {
    this.options.layout = layout
    this.applyOptions()
    this.refresh()
  }

  public setLabelThreshold(threshold: number) {
    this.options.labelThreshold = threshold
    this.refresh()
  }

  public setOptions(options: Partial<GraphOptions>) {
    this.options = { ...this.options, ...options }
    this.applyOptions()
    this.refresh()
  }

  public refresh() {
    this.graph.graphData(this.data)
  }

  public resetGraph() {
    this.graph.centerAt(0, 0).zoom(1).graphData(this.data)
  }

  public reset() {
    this.data = { nodes: [], links: [] }
    this.nodesMap.clear() // Clear the nodes map as well
    if (this.dataManager) {
      this.dataManager.reset()
    }
    this.graph.graphData(this.data)
  }

  public isLoading(): boolean {
    const isFetching = this.dataManager ? this.dataManager.isFetching() : false
    return this.isCalculating || isFetching
  }

  public getData(): GraphData {
    return this.data
  }
  public getNodesData(): GraphData['nodes'] {
    return this.data.nodes
  }
  public getLinksData(): GraphData['links'] {
    return this.data.links
  }

  public getLoadingState(): { isFetching: boolean; isCalculating: boolean } {
    const isFetching = this.dataManager ? this.dataManager.isFetching() : false
    return {
      isFetching,
      isCalculating: this.isCalculating,
    }
  }

  /**
   * Set the DataManager for handling data fetching and transformation
   */
  public setDataManager(dataManager: DataManager): void {
    this.dataManager = dataManager
  }

  /**
   * Get the current DataManager
   */
  public getDataManager(): DataManager | undefined {
    return this.dataManager
  }

  public destroy() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.graph._destructor()
  }
}
