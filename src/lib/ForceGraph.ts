import ForceGraphRenderer from 'force-graph'
import type { LinkObject } from 'force-graph'
import * as d3 from 'd3'
import type { GraphData, GraphOptions, NodeData, LinkData } from '../../interfaces/types'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import d3ForceClustering from 'd3-force-clustering'

export class ForceGraph {
  private container: HTMLElement
  private graph: ForceGraphRenderer<NodeData, LinkObject<NodeData>>
  private data: GraphData = { nodes: [], links: [] }
  private nodesMap: Map<string, NodeData> = new Map()
  private linkMap: Map<string, LinkData> = new Map()
  private options: GraphOptions
  private worker: Worker | null = null
  private groupBounds: Map<
    string,
    { minX: number; minY: number; maxX: number; maxY: number; nodes: NodeData[] }
  > = new Map()

  constructor(
    container: HTMLElement,
    initialData: GraphData = { nodes: [], links: [] },
    options: GraphOptions = {},
  ) {
    this.container = container
    this.data = initialData
    this.graph = new ForceGraphRenderer(this.container)

    // Initialize nodesMap with initial data for fast lookups
    // this.nodesMap = new Map()
    initialData.nodes.forEach((node) => {
      this.nodesMap.set(node.id.toString(), node)
    })

    // Base options without group defaults
    const baseOptions = {
      labelThreshold: 1.5,
      showGroups: false,
      ...options,
    }

    // Only add group defaults if grouping is enabled
    const groupDefaults = baseOptions.showGroups ? {
      groupBy: 'topic',
      groupBorderColor: '#666',
      groupBorderWidth: 2,
      groupBorderOpacity: 0.3,
      groupLabelColor: '#333',
      groupLabelSize: 16,
      groupLabelThreshold: 0.8,
      groupPadding: 20,
    } : {}

    this.options = {
      ...baseOptions,
      ...groupDefaults,
    }

    this.initGraph()
  }

  private initGraph() {
    console.log(this.options.width, this.options.width)

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
      .cooldownTime(this.calculateCooldownTime())
      .d3Force(
        'cluster',
        this.options.cluster ? d3ForceClustering().clusterId(this.options.cluster) : null,
      )
      // Force-directed layout with no collision
      .d3Force(
        'collide',
        this.options.collide
          ? d3.forceCollide<NodeData>().radius((node) => {
              if (this.options.collide) return this.options.collide(node)
              return node.marker.radius
            })
          : null,
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

    // Set initial data
    this.graphData(this.data)

    // Apply initial options
    this.applyOptions()
    this.render()
    // this.refreshGraph();

    // fit to canvas when engine stops
    this.graph.onEngineStop(() => this.graph.zoomToFit(400))
    // setTimeout(() => {

    //   this.graph.cooldownTicks(undefined);
    // }, 100);
  }
  public renderer() {
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

  public render() {
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
  public applyOptions() {
    // Set up canvas object rendering for both groups and nodes
    this.graph.nodeCanvasObject((node, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Render groups first (only once per frame, not per node)
      if (node === this.data.nodes[0]) {
        this.renderGroups(ctx, globalScale)
      }

      const size = this.getNodeSize(node) * 2
      const borderWidth =
        typeof this.options.nodeBorderWidth === 'function'
          ? this.options.nodeBorderWidth(node)
          : this.options.nodeBorderWidth

      // Draw the main node circle
      ctx.beginPath()
      ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI)
      ctx.fillStyle = this.getNodeColor(node)
      ctx.fill()

      // Draw the border if border width is greater than 0
      if (borderWidth && borderWidth > 0) {
        ctx.beginPath()
        ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI)
        ctx.strokeStyle = this.getNodeBorderColor(node)
        ctx.lineWidth = borderWidth
        ctx.stroke()
      }

      const label = this.getNodeLabel(node)
      if (label && globalScale >= (this.options.labelThreshold || 1.5)) {
        const color =
          typeof this.options.nodeLabelColor === 'function'
            ? this.options.nodeLabelColor(node)
            : (this.options.nodeLabelColor ?? '#555')
        ctx.font = `${Math.max(size, 8)}px Arial`
        ctx.fillStyle = color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, node.x || 0, (node.y || 0) + size + 2)
      }
    })

    // Apply link options
    this.applyLinkOptions()
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

    // Create a map of existing links
    const existingLinkKeys = new Set(
      this.data.links.map((link) => this.createLinkKey(link.source, link.target)),
    )

    // Filter out duplicate links
    const newLinks = data.links.filter(
      (link) => !existingLinkKeys.has(this.createLinkKey(link.source, link.target)),
    )

    // Update the data
    this.data = {
      nodes: [...this.data.nodes, ...newNodes],
      links: [...this.data.links, ...newLinks],
    }

    // Update the graph
    this.refreshGraph()
    // this.graphData(this.data); // same
  }

  private getNodeColor(node: NodeData): string {
    if (typeof this.options.nodeColor === 'function') {
      const color = this.options.nodeColor(node)
      if (color) return color
    }
    return node.color ?? ''
  }

  private getNodeBorderColor(node: NodeData): string {
    if (typeof this.options.nodeBorderColor === 'function') {
      return this.options.nodeBorderColor(node)
    }
    return this.options.nodeBorderColor || '#333'
  }

  private applyLinkOptions() {
    // Apply link width
    if (this.options.linkWidth !== undefined) {
      this.graph.linkWidth((link) => this.getLinkProperty(this.options.linkWidth, link) ?? 1)
    }

    // Apply link curvature
    if (this.options.linkCurvature !== undefined) {
      this.graph.linkCurvature(this.getLinkCurvature.bind(this))
    }

    // Apply directional particles
    if (this.options.linkDirectionalParticles) {
      this.graph.linkDirectionalParticles(
        (link) => this.getLinkProperty(this.options.linkDirectionalParticles, link) ?? 0,
      )
    }

    // Apply directional particle speed
    if (this.options.linkDirectionalParticleSpeed !== undefined) {
      this.graph.linkDirectionalParticleSpeed(
        (link) => this.getLinkProperty(this.options.linkDirectionalParticleSpeed, link) ?? 0,
      )
    }

    // Apply directional particle width
    if (this.options.linkDirectionalParticleWidth !== undefined) {
      this.graph.linkDirectionalParticleWidth(
        (link) => this.getLinkProperty(this.options.linkDirectionalParticleWidth, link) ?? 0,
      )
    }

    // Apply directional particle color
    if (this.options.linkDirectionalParticleColor !== undefined) {
      this.graph.linkDirectionalParticleColor(
        (link) => this.getLinkProperty(this.options.linkDirectionalParticleColor, link) ?? '#aaa',
      )
    }
  }

  private getLinkCurvature(link: LinkObject<NodeData>): number {
    if (typeof this.options.linkCurvature === 'function') {
      return this.options.linkCurvature(link as LinkData)
    }
    if (typeof this.options.linkCurvature === 'string') {
      // If it's a string, treat it as a property name on the link object
      return (link as any)[this.options.linkCurvature] || 0
    }
    if (typeof this.options.linkCurvature === 'number') {
      return this.options.linkCurvature
    }
    // Check if the link has a curvature property
    return (link as any).curvature || 0
  }

  private getLinkProperty<T>(option: T | ((link: LinkData) => T), link: LinkObject<NodeData>): T {
    if (typeof option === 'function') {
      return (option as (link: LinkData) => T)(link as LinkData)
    }
    return option
  }

  /**
   * Calculate group boundaries based on node positions
   */
  private calculateGroupBounds(): void {
    if (!this.options.showGroups) return

    this.groupBounds.clear()
    const padding = this.options.groupPadding || 20

    // Group nodes by the specified property
    const groups: Map<string, NodeData[]> = new Map()

    this.data.nodes.forEach((node) => {
      const groupId = this.getNodeGroupId(node)
      if (groupId) {
        if (!groups.has(groupId)) {
          groups.set(groupId, [])
        }
        groups.get(groupId)!.push(node)
      }
    })

    // Calculate bounds for each group
    groups.forEach((nodes, groupId) => {
      if (nodes.length === 0) return

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity

      nodes.forEach((node) => {
        if (node.x !== undefined && node.y !== undefined) {
          const nodeSize = this.getNodeSize(node)
          minX = Math.min(minX, node.x - nodeSize)
          minY = Math.min(minY, node.y - nodeSize)
          maxX = Math.max(maxX, node.x + nodeSize)
          maxY = Math.max(maxY, node.y + nodeSize)
        }
      })

      if (minX !== Infinity) {
        this.groupBounds.set(groupId, {
          minX: minX - padding,
          minY: minY - padding,
          maxX: maxX + padding,
          maxY: maxY + padding,
          nodes,
        })
      }
    })
  }

  /**
   * Get the group ID for a node
   */
  private getNodeGroupId(node: NodeData): string | undefined {
    if (!this.options.groupBy) return undefined

    if (typeof this.options.groupBy === 'function') {
      return this.options.groupBy(node)
    }

    if (typeof this.options.groupBy === 'string') {
      return (node as any)[this.options.groupBy]
    }

    return undefined
  }

  /**
   * Render group borders and labels
   */
  private renderGroups(ctx: CanvasRenderingContext2D, globalScale: number): void {
    if (!this.options.showGroups) return

    this.calculateGroupBounds()

    this.groupBounds.forEach((bounds, groupId) => {
      const borderColor = this.getGroupBorderColor(groupId)
      const borderWidth = this.options.groupBorderWidth || 2
      const borderOpacity = this.options.groupBorderOpacity || 0.3

      // Draw group border
      ctx.save()
      ctx.globalAlpha = borderOpacity
      ctx.strokeStyle = borderColor
      ctx.lineWidth = borderWidth / globalScale
      ctx.setLineDash([10 / globalScale, 5 / globalScale]) // Dashed border
      ctx.strokeRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY)
      ctx.restore()

      // Draw group label when zoomed out
      const labelThreshold = this.options.groupLabelThreshold || 0.8
      if (globalScale <= labelThreshold) {
        const labelColor = this.getGroupLabelColor(groupId)
        const labelSize = (this.options.groupLabelSize || 16) / globalScale

        ctx.save()
        ctx.font = `bold ${labelSize}px Arial`
        ctx.fillStyle = labelColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // Position label at the top center of the group
        const labelX = (bounds.minX + bounds.maxX) / 2
        const labelY = bounds.minY - labelSize / 2

        // Draw background for better readability
        const textMetrics = ctx.measureText(groupId)
        const textWidth = textMetrics.width
        const textHeight = labelSize

        ctx.globalAlpha = 0.8
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.fillRect(
          labelX - textWidth / 2 - 4,
          labelY - textHeight / 2 - 2,
          textWidth + 8,
          textHeight + 4,
        )

        ctx.globalAlpha = 1
        ctx.fillStyle = labelColor
        ctx.fillText(groupId, labelX, labelY)
        ctx.restore()
      }
    })
  }

  /**
   * Get group border color
   */
  private getGroupBorderColor(groupId: string): string {
    if (typeof this.options.groupBorderColor === 'function') {
      return this.options.groupBorderColor(groupId)
    }
    return this.options.groupBorderColor || '#666'
  }

  /**
   * Get group label color
   */
  private getGroupLabelColor(groupId: string): string {
    if (typeof this.options.groupLabelColor === 'function') {
      return this.options.groupLabelColor(groupId)
    }
    return this.options.groupLabelColor || '#333'
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

  /**
   * Calculate dynamic cooldown time based on node count
   * Minimum: 2500ms
   * Normal: node.length * 150ms
   */
  private calculateCooldownTime(): number {
    const nodeCount = this.data.nodes.length
    const calculatedTime = (nodeCount * 5) / 2
    const finalCooldownTime = Math.max(2500, calculatedTime)

    console.log(
      `Dynamic Cooldown Time: ${nodeCount} nodes × 150ms = ${calculatedTime}ms, final: ${finalCooldownTime}ms`,
    )

    return finalCooldownTime
  }

  /**
   * Get the current calculated cooldown time
   */
  public getCooldownTime(): number {
    return this.calculateCooldownTime()
  }

  /**
   * Manually update the cooldown time based on current node count
   */
  public updateCooldownTime(): void {
    this.graph.cooldownTime(this.calculateCooldownTime())
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
      this.refreshGraph()
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
      // Update cooldown time after removing node
      this.graph.cooldownTime(this.calculateCooldownTime())
      this.refreshGraph()
      return true
    }
    return false
  }

  public async addData(newData: GraphData): Promise<void> {
    // Add new nodes if they don't exist
    newData.nodes.forEach((node) => {
      if (!this.nodesMap.has(node.id.toString())) {
        this.nodesMap.set(node.id.toString(), node)
      } // else console.log('node already exists', node)
    })

    // Add new links if they don't exist
    newData.links.forEach((link) => {
      const key = this.createLinkKey(link.source, link.target)
      if (!this.linkMap.has(key)) {
        this.linkMap.set(key, link)
      } else console.log('link already exists', link)
    })

    // Update the data
    this.data = {
      nodes: Array.from(this.nodesMap.values()),
      links: Array.from(this.linkMap.values()),
    }

    // Update the graph
    console.log('this.data', this.data, newData)

    // Update cooldown time based on new node count
    this.graph.cooldownTime(this.calculateCooldownTime())

    // this.graphData(this.data)

    this.graph.graphData(this.data)
  }

  public setLabelThreshold(threshold: number) {
    this.options.labelThreshold = threshold
    this.render()
  }

  public setOptions(options: Partial<GraphOptions>) {
    this.options = { ...this.options, ...options }
    this.applyOptions()
  }

  /**
   * Lightweight refresh - only updates graph data
   */
  public refreshGraph() {
    this.graphData(this.data)
  }

  /**
   * Complete reinitialization - use when major changes are needed
   */
  public reinitialize() {
    this.initGraph()
  }

  public reset() {
    // Stop the force simulation completely
    this.graph.pauseAnimation()

    // Stop the D3 simulation engine
    const simulation = this.graph.d3Force('simulation')
    if (simulation) {
      simulation.stop()
    }

    // Clear all data structures
    this.data = { nodes: [], links: [] }
    this.nodesMap.clear() // Clear the nodes map as well

    this.graph = new ForceGraphRenderer(this.container)
    this.initGraph()
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

  private createLinkKey(source: string | number | NodeData, target: string | number | NodeData) {
    const sourceId = typeof source === 'object' ? source.id : source
    const targetId = typeof target === 'object' ? target.id : target
    return `${sourceId}-${targetId}`
  }
  /**
   * Set graph data (chainable method)
   * @param data - Graph data to set
   */
  public graphData(data: GraphData): ForceGraph {
    this.nodesMap.clear()
    this.linkMap.clear()

    // Add new nodes if they don't exist
    data.nodes.forEach((node) => {
      if (!this.nodesMap.has(node.id.toString())) {
        this.nodesMap.set(node.id.toString(), node)
      }
    })
    // Add new links if they don't exist
    data.links.forEach((link) => {
      const key = this.createLinkKey(link.source, link.target)
      if (!this.linkMap.has(key)) {
        this.linkMap.set(key, link)
      }
    })

    // Update the data
    this.data = {
      nodes: Array.from(this.nodesMap.values()),
      links: Array.from(this.linkMap.values()),
    }

    // Update cooldown time based on new node count
    this.graph.cooldownTime(this.calculateCooldownTime())

    this.graph.graphData(this.data)
    return this
  }

  /**
   * Enable or disable group visualization
   */
  public showGroups(show: boolean): ForceGraph {
    this.options.showGroups = show
    
    // If enabling groups and group defaults are not set, apply them
    if (show) {
      const groupDefaults = {
        groupBy: 'topic',
        groupBorderColor: '#666',
        groupBorderWidth: 2,
        groupBorderOpacity: 0.3,
        groupLabelColor: '#333',
        groupLabelSize: 16,
        groupLabelThreshold: 0.8,
        groupPadding: 20,
      }
      
      // Only set defaults for properties that are undefined
      Object.entries(groupDefaults).forEach(([key, value]) => {
        if (this.options[key as keyof GraphOptions] === undefined) {
          (this.options as any)[key] = value
        }
      })
    }
    
    this.applyOptions()
    // Force a refresh to immediately show/hide groups
    this.refreshGraph()
    return this
  }

  /**
   * Set the property to group nodes by
   */
  public setGroupBy(groupBy: string | ((node: NodeData) => string | undefined)): ForceGraph {
    this.options.groupBy = groupBy
    this.applyOptions()
    // Force a refresh to immediately update grouping
    this.refreshGraph()
    return this
  }

  /**
   * Set group visualization options
   */
  public setGroupOptions(options: {
    borderColor?: string | ((groupId: string) => string)
    borderWidth?: number
    borderOpacity?: number
    labelColor?: string | ((groupId: string) => string)
    labelSize?: number
    labelThreshold?: number
    padding?: number
  }): ForceGraph {
    if (options.borderColor !== undefined) this.options.groupBorderColor = options.borderColor
    if (options.borderWidth !== undefined) this.options.groupBorderWidth = options.borderWidth
    if (options.borderOpacity !== undefined) this.options.groupBorderOpacity = options.borderOpacity
    if (options.labelColor !== undefined) this.options.groupLabelColor = options.labelColor
    if (options.labelSize !== undefined) this.options.groupLabelSize = options.labelSize
    if (options.labelThreshold !== undefined)
      this.options.groupLabelThreshold = options.labelThreshold
    if (options.padding !== undefined) this.options.groupPadding = options.padding

    this.applyOptions()
    // Force a refresh to immediately update group styling
    this.refreshGraph()
    return this
  }

  /**
   * Get all available groups
   */
  public getGroups(): string[] {
    const groups = new Set<string>()
    this.data.nodes.forEach((node) => {
      const groupId = this.getNodeGroupId(node)
      if (groupId) {
        groups.add(groupId)
      }
    })
    return Array.from(groups)
  }

  /**
   * Get nodes in a specific group
   */
  public getNodesInGroup(groupId: string): NodeData[] {
    return this.data.nodes.filter((node) => this.getNodeGroupId(node) === groupId)
  }

  /**
   * Get current options
   */
  public getOptions(): GraphOptions {
    return { ...this.options }
  }

  public destroy() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.graph._destructor()
  }
}
