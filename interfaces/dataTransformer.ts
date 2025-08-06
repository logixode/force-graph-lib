import type { GraphData } from './types'
import type {
  EdgesItem,
  FullResponse,
  NodesItem,
  Pagination,
  TopicPlatformData,
} from './graphResponse'

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
  transformData(rawData: FullResponse<Pagination>): GraphData
}

/**
 * Default implementation of data transformation
 * Handles the current API response format
 */
export class DefaultDataTransformer implements DataTransformer {
  transformData(rawData: FullResponse<Pagination>): GraphData {
    const { data } = rawData

    const result: GraphData = { nodes: [], links: [] }

    // Handle different raw data structures
    if (Array.isArray(data.nodes)) {
      // Standard format with nodes and links arrays
      result.nodes = data.nodes.map((node) => ({
        ...node,
        id: node.id.toString(),
        label: node.label ?? node.title,
        color: node.color,
      }))

      if (Array.isArray(data.data)) {
        result.links = data.data.map((link) => ({
          ...link,
          source: link.source.toString(),
          target: link.target.toString(),
        }))
      }
    } else {
      result.nodes = this.flattenTopicPlatform(data.nodes).map((node) => ({
        ...node,
        label: node.label ?? node.title,
        id: node.id.toString(),
      }))
      result.links = this.flattenTopicPlatform(data.data).map(
        ({ color, platform, from, to, topic }) => ({
          color,
          platform,
          topic,
          source: from,
          target: to,
        }),
      )

      // console.log('nodes', result.nodes)
      // console.log('links', result.links)
    }

    return result
  }
  flattenTopicPlatform(
    data: TopicPlatformData<NodesItem> | TopicPlatformData<EdgesItem>,
  ): Record<string, any>[] {
    const flattenItem: Record<string, any>[] = []

    Object.entries(data).forEach(
      ([platform, platformData]: [string, TopicPlatformData<EdgesItem>]) => {
        Object.entries(platformData).forEach(([topic, topicItem]) => {
          Object.values(topicItem).forEach((item) => {
            flattenItem.push({ ...item, topic, platform })
            const isObj = (obj: any) => typeof obj === 'object' && obj !== null
            if (isObj(item.from) && isObj(item.to)) {
              console.log('item', item.from, item.to)
            }
          })
        })
      },
    )

    return flattenItem
  }
}

/**
 * Simple data transformer for basic node-link format
 */
export class SimpleDataTransformer implements DataTransformer {
  transformData(rawData: FullResponse<Pagination>): GraphData {
    const { data } = rawData

    const result: GraphData = { nodes: [], links: [] }

    // Simple transformation assuming nodes and links are arrays
    if (Array.isArray(data.nodes)) {
      result.nodes = data.nodes.map((node) => ({
        id: node.id.toString(),
        label: node.label || node.title || node.id.toString(),
        color: node.color,
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
