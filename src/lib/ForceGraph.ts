import ForceGraphRenderer from 'force-graph'
import * as d3 from 'd3'
import type {
  NodeData,
  ForceType,
  ForceFn,
  GraphOptions,
  LinkData,
  GraphData,
  NodeShape,
} from '../../interfaces/types'

/**
 * ForceGraph with flexible generic types.
 *
 * - `TNode`: your node shape; must include an `id` (`string | number`).
 * - `TLink`: your link shape; by default `LinkObject<TNode>`.
 *
 * Usage examples:
 *
 * // 1) Use defaults (compatible with NodeData/LinkObject)
 * const graph = new ForceGraph(container, defaultData)
 *
 * // 2) Provide custom shapes
 * type MyNode = NodeObject & { id: string; color?: string; size?: number }
 * type MyLink = LinkObject<MyNode> & { weight?: number }
 * const graph = new ForceGraph<MyNode, MyLink>(container, myData, {
 *   nodeSize: (n) => n.size ?? 2,
 *   nodeColor: (n) => n.color ?? '#999',
 *   linkWidth: (l) => (l.weight ?? 1) * 2,
 * })
 */
export class ForceGraph<
  TNode extends NodeData & { id: string | number } = NodeData,
  TLink extends LinkData<TNode> = LinkData<TNode>
> {
  private container: HTMLElement
  private graph: ForceGraphRenderer<TNode, TLink>
  private data: GraphData<TNode, TLink> = { nodes: [], links: [] }
  private nodesMap: Map<string, TNode> = new Map()
  private linkMap: Map<string, TLink> = new Map()
  private options: GraphOptions<TNode, TLink>
  private worker: Worker | null = null
  private groupHulls: Map<
    string,
    { points: [number, number][]; labelX: number; labelY: number; nodes: TNode[] }
  > = new Map()
  private nodeGroupsCache: Map<string, TNode[]> | null = null
  private isFirstRender: boolean = true
  private autoColorScale = d3.scaleOrdinal(d3.schemeCategory10)

  constructor(
    container: HTMLElement,
    initialData: GraphData<TNode, TLink> = { nodes: [], links: [] },
    options: GraphOptions<TNode, TLink> = {}
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
    const baseOptions: GraphOptions<TNode, TLink> = {
      labelThreshold: 1.5, // Show labels when they're not bigger than the node
      showGroups: false,
      ...options,
    }

    // Only add group defaults if grouping is enabled
    const groupDefaults = baseOptions.showGroups
      ? {
          groupBy: 'topic',
          groupFillColor: 'rgba(0, 0, 0, 0.05)',
          groupFillOpacity: 1,
          groupBorderColor: '#666',
          groupBorderWidth: 2,
          groupBorderOpacity: 0.3,
          groupLabelColor: '#333',
          groupLabelSize: 16,
          groupPadding: 20,
        }
      : {}

    this.options = {
      ...groupDefaults,
      ...baseOptions,
    }

    this.initGraph()
  }

  private initGraph() {
    // Apply initial options
    this.applyOptions()

    this.render()

    // Set initial data
    this.graphData(this.data)

    // this.refreshGraph();

    // Handle engine stop events with callbacks
    this.graph.onEngineStop(() => {
      if (!this.data.nodes.length) {
        this.isFirstRender = true
        return
      }

      if (this.isFirstRender) {
        // First render complete
        if (this.options.onRenderComplete) {
          this.options.onRenderComplete()
        } else {
          // Default behavior: zoom to fit
          this.graph.zoomToFit(400)
        }
        this.isFirstRender = false
      } else if (this.options.onGraphUpdated) {
        this.options.onGraphUpdated()
      }
    })

    // Calculate group hulls only when simulation is active (nodes moving)
    this.graph.onEngineTick(() => {
      this.calculateGroupHulls()
    })

    // setTimeout(() => {
    //   this.graph.cooldownTicks(undefined);
    // }, 100);
  }
  public renderer(): ForceGraphRenderer<TNode, TLink> {
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
    this.graph
      .width(this.options.width ?? 800)
      .height(this.options.height ?? 400)
      // .d3AlphaDecay(0.01)
      // .d3VelocityDecay(0.08)
      // .cooldownTicks(5000)
    // .cooldownTime(this.getCooldownTime())
    // .d3Force('charge', d3.forceManyBody().strength(this.options.nodeGap ?? -50))
    if (this.options.cooldownTicks !== undefined) {
      this.graph.cooldownTicks(this.options.cooldownTicks)
    }
  }
  public force(key: ForceType, func: ForceFn<TNode>) {
    return this.graph.d3Force(key, func)
  }
  private applyOptions() {
    if (this.options.keepDragPosition) {
      this.graph.onNodeDragEnd((node) => {
        node.fx = node.x
        node.fy = node.y
      })
    }
    if (!this.options.pointerInteraction) this.graph.enablePointerInteraction(false)

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

      const shape = this.resolveNodeShape(node)
      const nx = node.x || 0
      const ny = node.y || 0

      // Draw the main node shape
      this.drawNodeShape(ctx, nx, ny, size, shape)
      ctx.fillStyle = this.getNodeColor(node)
      ctx.fill()

      // Draw the border if border width is greater than 0
      if (borderWidth && borderWidth > 0) {
        this.drawNodeShape(ctx, nx, ny, size, shape)
        ctx.strokeStyle = this.getNodeBorderColor(node)
        ctx.lineWidth = borderWidth
        ctx.stroke()
      }

      const label = this.getNodeLabel(node)
      if (label && this.shouldShowLabel(node, globalScale)) {
        const color =
          typeof this.options.nodeLabelColor === 'function'
            ? this.options.nodeLabelColor(node)
            : this.options.nodeLabelColor ?? '#555'

        // Use fixed font size that doesn't scale with zoom
        const fontSize = this.options.labelFontSize || 14
        const scaledFontSize = fontSize / globalScale

        ctx.font = `${scaledFontSize}px Arial`
        ctx.fillStyle = color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, node.x || 0, (node.y || 0) + size + scaledFontSize / 2 + 2)
      }
    })

    // Apply link options
    this.applyLinkOptions()
  }

  private getNodeSize(node: TNode): number {
    if (typeof this.options.nodeSize === 'function') {
      return this.options.nodeSize(node) || (node as any)?.marker?.radius
    }
    return this.options.nodeSize || (node as any)?.marker?.radius || 1
  }

  private getNodeLabel(node: TNode): string {
    if (typeof this.options.nodeLabel === 'function') {
      return this.options.nodeLabel(node)
    }

    return (node as any)?.label || (node.id as string)
  }

  /**
   * Check if label should be shown based on threshold logic
   * The threshold determines when labels become too big relative to nodes
   */
  private shouldShowLabel(node: TNode, globalScale: number): boolean {
    const nodeSize = this.getNodeSize(node) * 2 // diameter
    const labelFontSize = this.options.labelFontSize || 14

    // Calculate the effective label size in world coordinates
    const effectiveLabelSize = labelFontSize / globalScale

    // Default threshold: show label when it's not bigger than the node
    const threshold = this.options.labelThreshold || 1.5

    // Show label when effective label size is smaller than node size * threshold
    return effectiveLabelSize <= nodeSize * threshold
  }

  public updateData(data: GraphData<TNode, TLink>): void {
    // Merge new data with existing data
    const existingNodeIds = new Set(this.data.nodes.map((node) => node.id.toString()))
    const newNodes = data.nodes.filter((node) => !existingNodeIds.has(node.id.toString()))

    // Add new nodes to the map
    newNodes.forEach((node) => {
      this.nodesMap.set(node.id.toString(), node)
    })

    // Create a map of existing links
    const existingLinkKeys = new Set(
      this.data.links.map((link) => this.createLinkKey(link.source, link.target))
    )

    // Filter out duplicate links
    const newLinks = data.links.filter(
      (link) => !existingLinkKeys.has(this.createLinkKey(link.source, link.target))
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

  private getNodeColor(node: TNode): string {
    if (typeof this.options.nodeColor === 'function') {
      const color = this.options.nodeColor(node)
      if (color) return color
    }
    return (node as any)?.color ?? ''
  }

  private getNodeBorderColor(node: TNode): string {
    if (typeof this.options.nodeBorderColor === 'function') {
      return this.options.nodeBorderColor(node)
    }
    return this.options.nodeBorderColor || '#333'
  }

  private resolveNodeShape(node: TNode): NodeShape {
    // Priority: per-node override > global option (static or function) > default 'circle'
    if (node.shape) return node.shape
    if (typeof this.options.nodeShape === 'function') return this.options.nodeShape(node)
    return this.options.nodeShape ?? 'circle'
  }

  private drawNodeShape(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    shape: NodeShape
  ): void {
    ctx.beginPath()
    switch (shape) {
      case 'square': {
        ctx.rect(x - size, y - size, size * 2, size * 2)
        break
      }
      case 'triangle': {
        // Equilateral triangle, centered on (x, y)
        const h = size * Math.sqrt(3)
        ctx.moveTo(x, y - size)
        ctx.lineTo(x + h / 2, y + size / 2)
        ctx.lineTo(x - h / 2, y + size / 2)
        ctx.closePath()
        break
      }
      case 'diamond': {
        // Square rotated 45deg
        ctx.moveTo(x, y - size)
        ctx.lineTo(x + size, y)
        ctx.lineTo(x, y + size)
        ctx.lineTo(x - size, y)
        ctx.closePath()
        break
      }
      case 'star': {
        // 5-pointed star with inner radius = size * 0.4
        const outerR = size
        const innerR = size * 0.4
        const points = 5
        for (let i = 0; i < points * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR
          const angle = (Math.PI / points) * i - Math.PI / 2
          const px = x + r * Math.cos(angle)
          const py = y + r * Math.sin(angle)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        break
      }
      case 'hexagon': {
        // Regular hexagon, flat-top orientation
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6
          const px = x + size * Math.cos(angle)
          const py = y + size * Math.sin(angle)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        break
      }
      case 'circle':
      default:
        ctx.arc(x, y, size, 0, 2 * Math.PI)
        break
    }
  }

  private applyLinkOptions() {
    // Apply link color
    this.graph.linkColor((link) => {
      if (typeof this.options.linkColor === 'function') return this.options.linkColor(link)
      if (this.options.linkColor) return this.options.linkColor
      return link.color ?? ''
    })

    // Apply link width
    if (this.options.linkWidth !== undefined) {
      this.graph.linkWidth(
        (link) => this.getLinkProperty(this.options.linkWidth!, link as TLink) ?? 1
      )
    }

    // Apply link curvature
    if (this.options.linkCurvature !== undefined) {
      this.graph.linkCurvature(this.getLinkCurvature.bind(this))
    }

    // Apply directional particles
    if (this.options.linkDirectionalParticles) {
      this.graph.linkDirectionalParticles(
        (link) => this.getLinkProperty(this.options.linkDirectionalParticles!, link as TLink) ?? 0
      )
    }

    // Apply directional particle speed
    if (this.options.linkDirectionalParticleSpeed !== undefined) {
      this.graph.linkDirectionalParticleSpeed(
        (link) =>
          this.getLinkProperty(this.options.linkDirectionalParticleSpeed!, link as TLink) ?? 0
      )
    }

    // Apply directional particle width
    if (this.options.linkDirectionalParticleWidth !== undefined) {
      this.graph.linkDirectionalParticleWidth(
        (link) =>
          this.getLinkProperty(this.options.linkDirectionalParticleWidth!, link as TLink) ?? 0
      )
    }

    // Apply directional particle color
    if (this.options.linkDirectionalParticleColor !== undefined) {
      this.graph.linkDirectionalParticleColor(
        (link) =>
          this.getLinkProperty(this.options.linkDirectionalParticleColor!, link as TLink) ?? '#aaa'
      )
    }
  }

  private getLinkCurvature(link: TLink): number {
    if (typeof this.options.linkCurvature === 'function') {
      return this.options.linkCurvature(link)
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

  private getLinkProperty<T>(option: T | ((link: TLink) => T), link: TLink): T {
    if (typeof option === 'function') {
      return (option as (link: TLink) => T)(link)
    }
    return option
  }

  /**
   * Calculate group convex hulls based on node positions
   */
  private calculateGroupHulls(): void {
    if (!this.options.showGroups) return

    this.groupHulls.clear()
    const padding = this.options.groupPadding || 20

    // Use cached group assignments to avoid expensive per-frame recalculations
    this.ensureNodeGroupsCache()
    const groups = this.nodeGroupsCache!

    // Calculate convex hull for each group
    groups.forEach((nodes, groupId) => {
      if (nodes.length === 0) return

      const points: [number, number][] = []
      let minTopY = Infinity
      let labelX = 0

      // Generate points around the perimeter of each node to ensure
      // a smooth, padded hull even if the group has 1 or 2 nodes.
      nodes.forEach((node) => {
        if (node.x !== undefined && node.y !== undefined) {
          const nodeRadius = this.getNodeSize(node)
          const offset = nodeRadius + padding
          
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4
            points.push([
              node.x + offset * Math.cos(angle),
              node.y + offset * Math.sin(angle)
            ])
          }
          
          // Track highest point for label positioning
          if (node.y - offset < minTopY) {
            minTopY = node.y - offset
            labelX = node.x
          }
        }
      })

      if (points.length >= 3) {
        const hull = d3.polygonHull(points)
        if (hull) {
          // Adjust labelX to center it over the topmost part of the hull
          const topPoints = hull.filter((p) => Math.abs(p[1] - minTopY) < padding)
          if (topPoints.length > 0) {
            labelX = topPoints.reduce((sum, p) => sum + p[0], 0) / topPoints.length
          }

          this.groupHulls.set(groupId, {
            points: hull,
            labelX,
            labelY: minTopY,
            nodes,
          })
        }
      }
    })
  }

  /**
   * Get the group ID for a node
   */
  private getNodeGroupId(node: TNode): string | undefined {
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
   * Populate group cache to prevent calculating on every frame
   */
  private ensureNodeGroupsCache(): void {
    if (this.nodeGroupsCache) return
    this.nodeGroupsCache = new Map()
    this.data.nodes.forEach((node) => {
      const groupId = this.getNodeGroupId(node)
      if (groupId) {
        if (!this.nodeGroupsCache!.has(groupId)) {
          this.nodeGroupsCache!.set(groupId, [])
        }
        this.nodeGroupsCache!.get(groupId)!.push(node)
      }
    })
  }

  /**
   * Render group hulls and labels
   */
  private renderGroups(ctx: CanvasRenderingContext2D, globalScale: number): void {
    if (!this.options.showGroups) return

    // Create D3 curve generator targeting the canvas context directly
    const lineGen = d3.line()
      .curve(d3.curveCatmullRomClosed)
      .context(ctx as any)

    this.groupHulls.forEach((hull, groupId) => {
      const fillColor = this.getGroupFillColor(groupId)
      const fillOpacity = this.options.groupFillOpacity ?? 1
      const borderColor = this.getGroupBorderColor(groupId)
      const borderWidth = this.options.groupBorderWidth ?? 0
      const borderOpacity = this.options.groupBorderOpacity ?? 0.3

      // Draw group hull
      ctx.save()
      ctx.beginPath()
      
      // @ts-ignore - D3 types might complain about line generator with canvas context
      lineGen(hull.points)
      
      // Fill background
      if (fillColor) {
        ctx.globalAlpha = fillOpacity
        ctx.fillStyle = fillColor
        ctx.fill()
      }

      // Draw border
      if (borderWidth > 0 && borderColor) {
        ctx.globalAlpha = borderOpacity
        ctx.strokeStyle = borderColor
        ctx.lineWidth = borderWidth / globalScale
        ctx.setLineDash([]) // Usually convex hulls are drawn solid, but this can be adjusted
        ctx.stroke()
      }
      ctx.restore()

      // Draw group label (always visible, no zoom threshold)
      const labelColor = this.getGroupLabelColor(groupId)
      const labelSize = (this.options.groupLabelSize || 16) / globalScale

      ctx.save()
      ctx.font = `bold ${labelSize}px Arial`
      ctx.fillStyle = labelColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Position label at the top center of the hull
      const lY = hull.labelY - labelSize / 2

      // Draw background for better readability
      const textMetrics = ctx.measureText(groupId)
      const textWidth = textMetrics.width
      const textHeight = labelSize

      ctx.globalAlpha = 0.8
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fillRect(
        hull.labelX - textWidth / 2 - 4,
        lY - textHeight / 2 - 2,
        textWidth + 8,
        textHeight + 4
      )

      ctx.globalAlpha = 1
      ctx.fillStyle = labelColor
      ctx.fillText(groupId, hull.labelX, lY)
      ctx.restore()
    })
  }

  /**
   * Get group fill color
   */
  private getGroupFillColor(groupId: string): string | undefined {
    let color: string | undefined
    if (typeof this.options.groupFillColor === 'function') {
      color = this.options.groupFillColor(groupId)
    } else {
      color = this.options.groupFillColor
    }

    if (color === 'auto') {
      return this.autoColorScale(groupId)
    }
    return color
  }

  /**
   * Get group border color
   */
  private getGroupBorderColor(groupId: string): string {
    let color: string | undefined
    if (typeof this.options.groupBorderColor === 'function') {
      color = this.options.groupBorderColor(groupId)
    } else {
      color = this.options.groupBorderColor
    }

    if (color === 'auto') {
      return this.autoColorScale(groupId)
    }
    return color || '#666'
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

  public getNodeById(id: string | number): TNode | undefined {
    return this.nodesMap.get(id.toString())
  }

  public hasNode(id: string | number): boolean {
    return this.nodesMap.has(id.toString())
  }

  /**
   * Calculate dynamic cooldown time based on node count
   * size calculated by node size + math(n) for better performance on first render
   * large size of graph consuming high memory when animating first render
   * so when render large graph, less cooldown time == quick display == high memory usage
   * more cooldown time == slow animating display == lower memory usage
   * Minimum: 4s (4000ms)
   * Normal: node.length * 125%
   */
  public getCooldownTime(): number {
    if (this.options.cooldownTime !== undefined) {
      return this.options.cooldownTime
    }
    const nodeCount = this.data.nodes.length
    const calculatedTime = nodeCount * (125 / 100) // 125%
    const finalCooldownTime = Math.max(4000, calculatedTime)

    // console.log(
    //   `Dynamic Cooldown Time: ${nodeCount} nodes × 150ms = ${calculatedTime}ms, final: ${finalCooldownTime}ms`
    // )

    return finalCooldownTime
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

  public updateNode(id: string | number, updates: Partial<TNode>): boolean {
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
        const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source
        const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target
        return sourceId?.toString() !== nodeId && targetId?.toString() !== nodeId
      })
      // Update cooldown time after removing node

      this.refreshGraph()
      return true
    }
    return false
  }

  public async addData(newData: GraphData<TNode, TLink>): Promise<void> {
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

    // Update cooldown time based on new node count
    this.graph.cooldownTime(this.getCooldownTime())

    this.graph.graphData(this.data)
  }
  public setLabelThreshold(threshold: number) {
    this.options.labelThreshold = threshold
    this.render()
  }

  public setOptions(options: Partial<GraphOptions<TNode, TLink>>) {
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

    // Clear all data structures
    this.data = { nodes: [], links: [] }
    this.nodesMap.clear() // Clear the nodes map as well

    this.graph = new ForceGraphRenderer(this.container)
    this.initGraph()
  }

  public getData(): GraphData<TNode, TLink> {
    return this.data
  }
  public getNodesData(): GraphData<TNode, TLink>['nodes'] {
    return this.data.nodes
  }
  public getLinksData(): GraphData<TNode, TLink>['links'] {
    return this.data.links
  }

  private createLinkKey(
    source: string | number | TNode | undefined,
    target: string | number | TNode | undefined
  ) {
    const sourceId =
      source === undefined ? 'undefined' : typeof source === 'object' ? (source as any).id : source
    const targetId =
      target === undefined ? 'undefined' : typeof target === 'object' ? (target as any).id : target
    return `${sourceId}-${targetId}`
  }
  /**
   * Set graph data (chainable method)
   * @param data - Graph data to set
   */
  public graphData(data: GraphData<TNode, TLink>): ForceGraph<TNode, TLink> {
    this.nodesMap.clear()
    this.linkMap.clear()
    this.nodeGroupsCache = null

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
    this.graph.cooldownTime(this.getCooldownTime())

    this.graph.graphData(this.data)
    return this
  }

  /**
   * Enable or disable group visualization
   */
  public showGroups(show: boolean): ForceGraph<TNode, TLink> {
    this.options.showGroups = show

    // If enabling groups and group defaults are not set, apply them
    if (show) {
      const groupDefaults = {
        groupBy: 'topic',
        groupFillColor: 'rgba(0, 0, 0, 0.05)',
        groupFillOpacity: 1,
        groupBorderColor: '#666',
        groupBorderWidth: 2,
        groupBorderOpacity: 0.3,
        groupLabelColor: '#333',
        groupLabelSize: 16,
        groupPadding: 20,
      }

      // Only set defaults for properties that are undefined
      Object.entries(groupDefaults).forEach(([key, value]) => {
        if (this.options[key as keyof GraphOptions<TNode, TLink>] === undefined) {
          ;(this.options as any)[key] = value
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
  public setGroupBy(
    groupBy: string | ((node: TNode) => string | undefined)
  ): ForceGraph<TNode, TLink> {
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
    fillColor?: string | ((groupId: string) => string)
    fillOpacity?: number
    borderColor?: string | ((groupId: string) => string)
    borderWidth?: number
    borderOpacity?: number
    labelColor?: string | ((groupId: string) => string)
    labelSize?: number
    padding?: number
  }): ForceGraph<TNode, TLink> {
    if (options.fillColor !== undefined) this.options.groupFillColor = options.fillColor
    if (options.fillOpacity !== undefined) this.options.groupFillOpacity = options.fillOpacity
    if (options.borderColor !== undefined) this.options.groupBorderColor = options.borderColor
    if (options.borderWidth !== undefined) this.options.groupBorderWidth = options.borderWidth
    if (options.borderOpacity !== undefined) this.options.groupBorderOpacity = options.borderOpacity
    if (options.labelColor !== undefined) this.options.groupLabelColor = options.labelColor
    if (options.labelSize !== undefined) this.options.groupLabelSize = options.labelSize
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
  public getNodesInGroup(groupId: string): TNode[] {
    return this.data.nodes.filter((node) => this.getNodeGroupId(node) === groupId)
  }

  /**
   * Get current options
   */
  public getOptions(): GraphOptions<TNode, TLink> {
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
