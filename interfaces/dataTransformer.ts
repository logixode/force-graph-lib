import type { GraphData } from './types'
import type { FullResponse, Pagination } from './graphResponse'

/**
 * Interface for data transformation implementations
 * This allows developers to customize how raw API data is transformed into GraphData
 */
export interface DataTransformer {
  /**
   * Transform raw API response data into GraphData format
   * @param rawData - The raw response from the API
   * @param platformColors - Color mapping for different platforms
   * @returns Transformed GraphData
   */
  transformData(
    rawData: FullResponse<Pagination>,
    platformColors: Record<string, string>,
  ): GraphData
}

/**
 * Default implementation of data transformation
 * Handles the current API response format
 */
export class DefaultDataTransformer implements DataTransformer {
  transformData(
    rawData: FullResponse<Pagination>,
    platformColors: Record<string, string>,
  ): GraphData {
    const { data } = rawData

    const result: GraphData = { nodes: [], links: [] }

    // Handle different raw data structures
    if (Array.isArray(data.nodes)) {
      // Standard format with nodes and links arrays
      result.nodes = data.nodes.map((node) => ({
        ...node,
        id: node.id.toString(), // Ensure ID is a string
        value: node.value || 1,
        label: node.label || node.name || node.id.toString(),
        color:
          node.color ||
          (node.platform && platformColors[node.platform.toLowerCase()]) ||
          platformColors.default,
      }))

      if (Array.isArray(data.data)) {
        result.links = data.data.map((link) => ({
          ...link,
          source: link.source.toString(),
          target: link.target.toString(),
          weight: link.weight || 1,
        }))
      }
    } else if (data && Array.isArray(data.nodes)) {
      // Format with data wrapper
      result.nodes = data.nodes.map((node) => ({
        ...node,
        id: node.id.toString(),
        value: node.value || 1,
        label: node.label || node.name || node.id.toString(),
        color:
          node.color ||
          (node.platform && platformColors[node.platform.toLowerCase()]) ||
          platformColors.default,
      }))

      if (data && Array.isArray(data.data)) {
        result.links = data.data.map((link) => ({
          ...link,
          source: link.source.toString(),
          target: link.target.toString(),
          weight: link.weight || 1,
        }))
      }
    } else {
      // Process data structure - handle both data.topic and direct topic arrays
      // Nodes is a Record<Platform, TopicItems<NodesItem>> not an array, so we need to process it differently
      const flattenNodes: Record<string, unknown>[] = []
      const flattenEges: Record<string, unknown>[] = []
      const topicNodes: Record<string, unknown>[] = []
      const platforms: string[] = []

      // Process nodes from each platform according to the interface structure
      if (data.nodes && data.data) {
        Object.entries(data.nodes).forEach(([platform, platformNodes]) => {
          platforms.push(platform)

          const platformEdges = data.data[platform as keyof typeof data.data]
          const platformColor = platformColors[platform]

          // Process nodes data if available
          if (data && platformNodes) {
            Object.entries(platformNodes).forEach(([topic, nodesItem]) => {
              if (nodesItem) {
                Object.entries(nodesItem).forEach(([nodeKey, node]) => {
                  const label = node.label ?? node.title
                  const nodeData = {
                    ...node,
                    label,
                    color: nodeKey == '0' ? '#000000' : node.color || platformColor,
                    platform,
                    topic,
                    // x:0,
                    // y:0,
                  }

                  if (nodeKey == '0') topicNodes.push(nodeData)
                  else flattenNodes.push(nodeData)

                  result.nodes.push(nodeData)
                })
              }
            })
          }

          // Process edges data if available
          if (data.data && platformEdges) {
            Object.entries(platformEdges).forEach(([topic, edgesItem]) => {
              if (edgesItem) {
                Object.values(edgesItem).forEach((edge) => {
                  if (edge && edge.from && edge.to) {
                    const linkData = {
                      source: edge.from,
                      target: edge.to,
                      color: edge.color,
                      platform,
                      topic,
                    }
                    result.links.push(linkData)
                    flattenEges.push(linkData)
                  }
                })
              }
            })
          }
        })
      }

      console.log('nodes', result.nodes)
      console.log('links', result.links)
    }

    return result
  }
}

/**
 * Simple data transformer for basic node-link format
 */
export class SimpleDataTransformer implements DataTransformer {
  transformData(
    rawData: FullResponse<Pagination>,
    platformColors: Record<string, string>,
  ): GraphData {
    const { data } = rawData

    const result: GraphData = { nodes: [], links: [] }

    // Simple transformation assuming nodes and links are arrays
    if (Array.isArray(data.nodes)) {
      result.nodes = data.nodes.map((node) => ({
        id: node.id.toString(),
        label: node.label || node.title || node.id.toString(),
        color: node.color || platformColors.default,
        value: node.value || 1,
        ...node,
      }))
    }

    if (Array.isArray(data.data)) {
      result.links = data.data.map((link) => ({
        source: link.source.toString(),
        target: link.target.toString(),
        weight: link.weight || 1,
        ...link,
      }))
    }

    return result
  }
}
