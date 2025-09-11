import type { ForceGraph } from '@/index'
import { DefaultDataFetcher } from '@/../interfaces/dataFetcher'
import { DataManager } from '@/../interfaces/dataManager'
import { DefaultDataTransformer } from '@/../interfaces/dataTransformer'
import type { Pagination } from '@/../interfaces/graphResponse'
import { createContext } from 'reka-ui'
import { ref, shallowRef, type Ref, type ShallowRef } from 'vue'

export interface GraphContext {
  graph: ShallowRef<ForceGraph | null>
  pagination: Ref<Pagination | null>
  dataManager: Ref<DataManager | undefined>
  labelThreshold: Ref<number[]>
  loadMoreBtn: Ref<{
    status: boolean
    text: string
  }>
  nodeSelect: Ref<{
    options: {
      label: string
      value: string
    }[]
    selected: unknown
  }>
  fetchLoading: Ref<boolean>
  renderLoading: Ref<boolean>
  updateLoadingIndicator: () => void
}

export function registerGraphContext() {
  const graph = shallowRef<ForceGraph | null>(null)
  const pagination = ref<Pagination | null>(null)

  // Create data management components
  const dataFetcher = new DefaultDataFetcher(
    (process.env.NODE_ENV === 'production' ? '/force-graph-lib' : '') + '/fetch'
  )
  const dataTransformer = new DefaultDataTransformer()
  // Create a DataManager instance
  // Import DataManager from the same path as in GraphContext to ensure type compatibility
  const dataManager = ref(new DataManager(dataFetcher, dataTransformer)) as Ref<DataManager>

  // graph options
  const loadMoreBtn = ref({
    status: true,
    text: 'Load More',
  })
  const labelThreshold = ref([1.2])
  const nodeSelect = ref({
    options: [] as {
      label: string
      value: string
    }[],
    selected: null as unknown,
  })
  const fetchLoading = ref(false)
  const renderLoading = ref(false)
  const nodeSearch = ref<string>()

  // Create and provide the graph context
  const updateLoadingIndicator = () => {
    loadMoreBtn.value.status = true
    // Update node selectbox if search is active
    if (nodeSearch.value) {
      populateNodeSelect(nodeSearch.value)
    }
  }

  // Function to populate node selectbox
  const populateNodeSelect = (searchTerm: string = '') => {
    if (!graph.value) return

    let graphData = graph.value.getData()
    const nodes = graphData.nodes || []

    // Clear existing options
    nodeSelect.value.selected = null
    nodeSelect.value.options = []

    // Filter nodes based on search term
    const filteredNodes = nodes.filter((node) => {
      const nodeLabel = node.label || node.id.toString()
      const nodeId = node.id.toString()
      const platform = node.platform || ''

      return (
        nodeLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nodeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        platform.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })

    // Sort nodes by label for better UX
    filteredNodes.sort((a, b) => {
      const labelA = a.label || a.id.toString()
      const labelB = b.label || b.id.toString()
      return labelA.localeCompare(labelB)
    })

    // Add filtered nodes to select
    filteredNodes.forEach((node) => {
      const nodeLabel = node.label || node.id.toString()
      const platform = node.platform ? ` (${node.platform})` : ''

      nodeSelect.value.options.push({
        label: `${nodeLabel}${platform}`,
        value: node.id.toString(),
      })
    })
  }

  createGraphContext({
    graph,
    pagination,
    dataManager,
    labelThreshold,
    loadMoreBtn,
    nodeSelect,
    fetchLoading,
    renderLoading,
    updateLoadingIndicator,
  })

  return {
    graph,
    pagination,
    dataManager,
    labelThreshold,
    loadMoreBtn,
    nodeSelect,
    fetchLoading,
    renderLoading,
    updateLoadingIndicator,
  }
}

export const [useGraphContext, createGraphContext] = createContext<GraphContext>(['graph'])
