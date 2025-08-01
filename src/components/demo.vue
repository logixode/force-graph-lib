<template>
  <div class="">
    <GraphOptions />

    <div class="w-full h-[35rem] bg-primary/20 rounded-md p-2 relative" v-auto-animate>
      <div ref="graphContainer" class="w-full h-full" />

      <div
        v-if="fetchLoading"
        class="absolute inset-0 flex items-center justify-center bg-background/70"
      >
        <div class="flex gap-2 animate-pulse items-center">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          Loading fetch data...
        </div>
      </div>
      <div
        v-else-if="renderLoading"
        class="absolute inset-0 flex items-center justify-center bg-background/70"
      >
        <div class="flex gap-2 animate-pulse items-center">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          Rendering graph layout...
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
    {{ graphOptions }}
  </div>
</template>

<script setup lang="ts">
import { ForceGraph } from '@/lib/ForceGraph'
import { DefaultDataFetcher } from '../../interfaces/dataFetcher'
import { DataManager } from '../../interfaces/dataManager'
import { DefaultDataTransformer } from '../../interfaces/dataTransformer'
import { computed, onMounted, provide, ref, watch, type Ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import type { GraphOptions as GraphOptionsType, NodeData } from '../../interfaces/types'
import GraphOptions from './GraphOptions.vue'
import type { GraphContext } from '../types/graph-context'

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

// graph options
const loadMoreBtn = ref({
  status: true,
  text: 'Load More',
})
const labelThreshold = ref([1.2])
const layout = ref<'force' | 'circlepack'>('force')

// graph related data
const graph = ref<ForceGraph>()
const graphContainer = ref<HTMLDivElement>()
const { width, height } = useElementSize(graphContainer)

const graphOptions = computed<GraphOptionsType>(() => ({
  width: width.value,
  height: height.value,
  // layout: "circlepack",
  labelThreshold: labelThreshold.value[0],
  keepDragPosition: true,
  // nodeSize: (node: NodeData) => node.value ? Math.sqrt(node.value) / 100 + 3 : 3,
  nodeLabel: (node: NodeData) => {
    const label = node.label || String(node.id)
    return `${label}${node.type ? ` (${node.type})` : ''}`
  },
  nodeColor: (node: NodeData) => {
    if (!node.type) return `#eeed11`
    return ''
  },
  cluster: (node: NodeData) => node.sentiment || node.platform,
}))

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

// Create and provide the graph context
const updateLoadingIndicator = () => {
  if (!dataManager.value) return

  const paginationInfo = {
    currentPage: dataManager.value.getCurrentPage(),
    totalPages: dataManager.value.getTotalPages(),
    isLastPage: dataManager.value.getIsLastPage(),
  }

  if (paginationInfo?.isLastPage) {
    loadMoreBtn.value.text = 'All Data Loaded'
  } else {
    loadMoreBtn.value.text = `Load More Data (${paginationInfo?.currentPage || 0}/${paginationInfo?.totalPages || 5})`
  }
  loadMoreBtn.value.status = true

  // Update node selectbox if search is active
  if (nodeSearch.value) {
    populateNodeSelect(nodeSearch.value)
  }
}

// Provide the graph context to child components
const graphContext: GraphContext = {
  graph,
  dataManager,
  layout,
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
  if (graph.value && dataManager.value) {
    graph.value.setDataManager(dataManager.value)
  }

  // Initial data load
  fetchLoading.value = true
  try {
    if (dataManager.value) {
      const newData = await dataManager.value.fetchNextPage()
      if (newData && graph.value) {
        graph.value.addData(newData)
        nodeSelect.value.options.push(
          ...graph.value.getNodesData().map((node) => ({
            label: node.label || String(node.id),
            value: node.id.toString(),
          })),
        )
      }
    }
  } catch (error) {
    console.error('Error fetching initial data:', error)
  }
  fetchLoading.value = false

  // Set up interval to check loading status
  setInterval(updateLoadingIndicator, 500)
})

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

  // Store current graph data and options
  const currentData = graph.value.getData() || initialData

  // Recreate graph with new dimensions
  graph.value = new ForceGraph(graphContainer.value, currentData, graphOptions.value)

  // Set the data manager on the graph if available
  if (graph.value && dataManager.value) {
    graph.value.setDataManager(dataManager.value)
  }
})
</script>
