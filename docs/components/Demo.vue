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
      <div class="absolute bottom-2 left-3 text-xs [&>p]:leading-4 [&>p]:m-0">
        <p>nodes: {{ graph?.getDataSize().nodes }}</p>
        <p>links: {{ graph?.getDataSize().links }}</p>
      </div>
    </div>
    <pre>{{ graphOptions }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ForceGraph } from '@/lib/ForceGraph'
import { computed, onMounted, watch, useTemplateRef } from 'vue'
import { useDark, useElementSize } from '@vueuse/core'
import type { GraphData, GraphOptions as GraphOptionsType, NodeData } from '../../interfaces/types'
import GraphOptions from './GraphOptions.vue'
import { useFetchGraph } from '@docs/composables/useFetchGraph'
import { registerGraphContext } from '@docs/context/graphContext'

const isDark = useDark()
const { data, page, promise, endpoint, accessToken, isLoading, isFetching, error, refetch } =
  useFetchGraph()

// Graph context state
const {
  graph,
  pagination,
  dataManager,
  labelThreshold,
  loadMoreBtn,
  nodeSelect,
  fetchLoading,
  updateLoadingIndicator,
} = registerGraphContext()

// graph related data
const graphContainer = useTemplateRef('graphContainer')
const { width, height } = useElementSize(graphContainer)
const labelColor = computed(
  () =>
    ({
      dark: '#eee',
      light: '#222',
    }[isDark.value ? 'dark' : 'light'])
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
    loadMoreBtn.value.text = `Load More Data (${pageInfo?.currentPage || 0}/${
      pageInfo?.totalPages || 5
    })`
  }
})

const graphOptions = computed<GraphOptionsType>(() => ({
  width: width.value,
  height: height.value,

  groupBorderColor: (val) => {
    try {
      if (val && platformColors[val.toLowerCase()]) {
        return platformColors[val.toLowerCase()]
      }
    } catch (err) {}
    return '#666'
  },

  labelThreshold: labelThreshold.value[0],
  // keepDragPosition: true,
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
  nodeClickHandler(node) {
    alert(node.label)
  },
}))

onMounted(async () => {
  if (!graphContainer.value) return
  graph.value = new ForceGraph(graphContainer.value, initialData, graphOptions.value)
  graph.value.renderer().enablePointerInteraction(false)

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
        }))
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
  if (!graph.value) return
  graph.value.setOptions({ width: newVal[0], height: newVal[1] })
  graph.value.reinitialize()

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
