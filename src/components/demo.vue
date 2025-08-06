<template>
  <div class="">
    <GraphOptions />

    <div class="w-full h-[35rem] bg-card/50 shadow-xl rounded-md p-2 relative" v-auto-animate>
      <div ref="graphContainer" class="w-full h-full" />

      <div
        v-if="fetchLoading && isLoading"
        class="absolute inset-0 flex items-center justify-center bg-background/70"
      >
        <div class="flex gap-2 animate-pulse items-center">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          Loading fetch data...
        </div>
      </div>
      <div v-else-if="isFetching" class="absolute top-3 right-3 flex items-center justify-center">
        <div class="flex gap-2 animate-pulse items-center">
          <div class="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
          Loading new data...
        </div>
      </div>

      <div class="absolute bottom-2 right-3 text-xs">
        {{ graphContainer?.clientWidth }}x{{ graphContainer?.clientHeight }}
      </div>
      <div class="absolute bottom-2 left-3 text-xs">
        <p>nodes: {{ graph?.getDataSize().nodes }}</p>
        <p>links: {{ graph?.getDataSize().links }}</p>
      </div>
    </div>
    <pre>{{ graphOptions }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ForceGraph } from '@/lib/ForceGraph'
import { DefaultDataFetcher } from '../../interfaces/dataFetcher'
import { DataManager } from '../../interfaces/dataManager'
import { DefaultDataTransformer } from '../../interfaces/dataTransformer'
import { computed, onMounted, provide, ref, watch, watchEffect, type Ref } from 'vue'
import { useDark, useElementSize } from '@vueuse/core'
import type { GraphData, GraphOptions as GraphOptionsType, NodeData } from '../../interfaces/types'
import GraphOptions from './GraphOptions.vue'
import type { GraphContext } from '../types/graph-context'
import { useFetchGraph } from '@/composeables/useFetchGraph'
import type { Pagination } from 'interfaces/graphResponse'

const isDark = useDark()
const { data, page, promise, endpoint, accessToken, isLoading, isFetching, error, refetch } =
  useFetchGraph()

// Graph context state
const fetchLoading = ref(false)
const renderLoading = ref(false)
const nodeSearch = ref<string>()
const nodeSelect = ref({
  options: [] as {
    label: string
    value: string
  }[],
  selected: null as unknown,
})
const pagination = ref<Pagination | null>(null)

// graph options
const loadMoreBtn = ref({
  status: true,
  text: 'Load More',
})
const labelThreshold = ref([1.2])

// graph related data
const graph = ref<ForceGraph>()
const graphContainer = ref<HTMLDivElement>()
const { width, height } = useElementSize(graphContainer)
const labelColor = computed(
  () =>
    ({
      dark: '#eee',
      light: '#222',
    })[isDark.value ? 'dark' : 'light'],
)

// Define platform colors
const platformColors: Record<string, string> = {
  keyword: '#FA8F21',
  facebook: '#1877F2',
  twitter: '#55ACEE',
  instagram: '#DC2391',
  youtube: '#F00',
  tiktok: '#F3F4F6',
  default: '#999',
}

const initialData = {
  nodes: [],
  links: [],
}

// Create data management components
const dataFetcher = new DefaultDataFetcher()
const dataTransformer = new DefaultDataTransformer()

// Create a DataManager instance
// Import DataManager from the same path as in GraphContext to ensure type compatibility
const dataManager = ref(new DataManager(dataFetcher, dataTransformer)) as Ref<DataManager>

watch([() => loadMoreBtn.value.status, pagination], () => {
  const pageInfo = {
    currentPage: dataManager.value?.getCurrentPage(),
    totalPages: dataManager.value?.getTotalPages() ?? 1,
    isLastPage: dataManager.value?.getIsLastPage(),
  }
  if (data.value?.pagination) {
    pageInfo.currentPage = pagination.value?.pageCurrent ?? 1
    pageInfo.totalPages = pagination.value?.pageLast ?? 1
    pageInfo.isLastPage = pagination.value?.pageLast === pagination.value?.pageCurrent
  }

  if (pageInfo?.isLastPage) {
    loadMoreBtn.value.text = 'All Data Loaded'
  } else {
    loadMoreBtn.value.text = `Load More Data (${pageInfo?.currentPage || 0}/${pageInfo?.totalPages || 5})`
  }
})

// Create and provide the graph context
const updateLoadingIndicator = () => {
  loadMoreBtn.value.status = true
  // Update node selectbox if search is active
  if (nodeSearch.value) {
    populateNodeSelect(nodeSearch.value)
  }
}

const graphOptions = computed<GraphOptionsType>(() => ({
  width: width.value,
  height: height.value,
  labelThreshold: labelThreshold.value[0],
  keepDragPosition: true,
  linkWidth: 0.4,
  nodeSize,
  nodeLabel: (node: NodeData) => {
    const label = node.label || String(node.id)
    return `${label}${node.type ? ` (${node.type})` : ''}`
  },
  nodeLabelColor: labelColor.value,
  nodeColor: (node: NodeData) => {
    if (!node.type) return `#eeed11`
    // Use platform-based coloring if available
    else if (node.platform && platformColors[node.platform.toLowerCase()]) {
      return platformColors[node.platform.toLowerCase()]
    }

    return ''
  },
  nodeBorderColor: 'white',
  nodeBorderWidth: (node: NodeData) => {
    // Different border widths based on node importance or type
    if (node.type === 'topic' || !node.type) return 0.7
    else if (node.type == 'repost') return 0.5

    return 0
  },
  collide: (node: NodeData) => {
    const isTopic = node.type === 'topic' || !node.type
    if (isTopic) return nodeSize(node) * 10
    else if (node.type === 'post') return nodeSize(node) * 5

    // return nodeSize(node)
    return 1
  },
  cluster: (node: NodeData) => node.sentiment || node.platform,
  linkCurvature: 0.1,
}))

// Provide the graph context to child components
const graphContext: GraphContext = {
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

provide('graphContext', graphContext)

onMounted(async () => {
  if (!graphContainer.value) return
  graph.value = new ForceGraph(graphContainer.value, initialData, graphOptions.value)

  // Set the data manager on the graph
  // if (graph.value && dataManager.value) {
  //   graph.value.setDataManager(dataManager.value)
  // }

  // Initial data load
  fetchLoading.value = true

  try {
    let newData: GraphData | null = null
    if (endpoint && accessToken) {
      console.log((await promise.value).data)
      newData = data.value?.data ?? null
      pagination.value = data.value?.pagination ?? null
    } else if (dataManager.value) {
      newData = await dataManager.value.fetchNextPage()
    }

    console.log(newData)

    if (newData && graph.value) {
      graph.value.addData(newData)
      nodeSelect.value.options.push(
        ...graph.value.getNodesData().map((node) => ({
          label: node.label || String(node.id),
          value: node.id.toString(),
        })),
      )
    }
  } catch (error) {
    console.error('Error fetching initial data:', error)
  }
  fetchLoading.value = false

  // Set up interval to check loading status
  updateLoadingIndicator()
})

function nodeSize(node: NodeData) {
  if (!node.type) return 3
  else if (node.type === 'post') return 1.8
  else if (node.type == 'repost') return 1.5
  else if (node.type === 'mentions') return 1.3

  return 1
}

// Function to populate node selectbox
const populateNodeSelect = (searchTerm: string = '') => {
  if (!graph.value) return

  const graphData = graph.value.getData()
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

// Watch for changes in width and height from useElementSize
watch([width, height], (newVal, oldVal) => {
  if (
    newVal[0] > oldVal[0] - 10 &&
    newVal[0] < oldVal[0] + 10 &&
    newVal[1] > oldVal[1] - 10 &&
    newVal[1] < oldVal[1] + 10
  )
    return

  if (!graphContainer.value || !graph.value) return
  graph.value.setOptions({ width: newVal[0], height: newVal[1] })
  graph.value?.reinitialize()

  // // Store current graph data and options
  // const currentData = graph.value.getData() || initialData

  // // Recreate graph with new dimensions
  // graph.value = new ForceGraph(graphContainer.value, currentData, graphOptions.value)

  // // Set the data manager on the graph if available
  // if (graph.value && dataManager.value) {
  //   graph.value.setDataManager(dataManager.value)
  // }
})

watch(isDark, () => {
  if (!graph.value) return
  graph.value.setOptions({ nodeLabelColor: labelColor.value })
})
</script>
