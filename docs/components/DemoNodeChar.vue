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
        |
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
import type {
  GraphData,
  GraphOptions as GraphOptionsType,
  LinkData,
  NodeData,
  NodeChar,
} from '../../interfaces/types'
import GraphOptions from './GraphOptions.vue'
import { useFetchGraph } from '@docs/composables/useFetchGraph'
import { registerGraphContext } from '@docs/context/graphContext'

const isDark = useDark()

// Graph context state
const {
  graph,
  apiSetting,
  pagination,
  dataManager,
  labelThreshold,
  loadMoreBtn,
  nodeSelect,
  fetchLoading,
  updateLoadingIndicator,
} = registerGraphContext()

const { data, promise, endpoint, accessToken, isLoading, isFetching, error, refetch } =
  useFetchGraph(apiSetting)

// graph related data
const graphContainer = useTemplateRef('graphContainer')
const { width, height } = useElementSize(graphContainer)
const labelColor = computed(
  () =>
    ({
      dark: '#eee',
      light: '#222',
    })[isDark.value ? 'dark' : 'light'],
)

// Define node char mapping by node type
const nodeTypeCharMap: Record<string, { char: string }> = {
  keyword: { char: '📝' },
  post: { char: '📝' },
  mentions: { char: '🔁' },
  default: { char: '●' },
}

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

const initialData: GraphData<NodeData, LinkData<NodeData>> = {
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

const graphOptions = computed<GraphOptionsType<NodeData, LinkData<NodeData>>>(() => ({
  width: width.value,
  height: height.value,

  labelThreshold: labelThreshold.value[0],
  linkWidth: 0.4,
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
    if (node.type === 'topic' || !node.type) return 0.7
    else if (node.type === 'repost') return 0.5

    return 0
  },
  nodeGap: -200,
  linkCurvature: 0.1,
  // nodeChar callback: returns null for nodes without a type mapping — zero overhead
  nodeChar: (node: NodeData): NodeChar | null => {
    if (!node.type || !nodeTypeCharMap[node.type]) return null
    const meta = nodeTypeCharMap[node.type]

    return {
      char: meta.char,
      color: isDark.value ? '#fff' : '#111',
    }
  },
}))

onMounted(async () => {
  if (!graphContainer.value) return
  graph.value = new ForceGraph(graphContainer.value, initialData, graphOptions.value)

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
})

watch(isDark, () => {
  if (!graph.value) return
  // Re-apply both nodeLabelColor and nodeChar color together when dark mode changes
  graph.value.setOptions({
    nodeLabelColor: labelColor.value,
    nodeChar: graphOptions.value.nodeChar,
  })
})
</script>
