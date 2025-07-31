<template>
  <div class="">
    <Collapsible
      v-model:open="isOpen"
      class="space-y-2 bg-card shadow-xl shadow-amber-50 rounded-md mb-2"
    >
      <CollapsibleTrigger as-child>
        <Button variant="ghost" size="sm" class="font-bold w-full p-0 m-0">
          Graph Control
          <ChevronsUpDown class="h-4 w-4" />
          <span class="sr-only">Toggle</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent class="p-4 space-y-2">
        <div class="flex gap-2 flex-wrap">
          <div class="control-group">
            <!-- <label for="layout-toggle-v2">Layout:</label> -->
            <Button id="layout-toggle-v2" @click="toggleLayout">
              {{ layout === 'force' ? 'Switch to Circle Pack' : 'Switch to Force Directed' }}
            </Button>
          </div>
          <div class="control-group">
            <Button id="refresh-btn-v2" @click="refreshGraph">Refresh Graph</Button>
          </div>

          <div class="control-group">
            <Button id="reset-btn-v2" @click="resetGraph">Reset Graph</Button>
          </div>

          <div class="control-group">
            <Button id="load-more-btn-v2" :disabled="!loadMoreBtn.status" @click="loadMoreData">
              {{ loadMoreBtn.text }}
            </Button>
          </div>
        </div>

        <div class="flex gap-2 flex-wrap">
          <Select
            v-model="nodeSelect.selected as string"
            @update:modelValue="focusOnNode(String($event))"
          >
            <SelectTrigger class="w-[180px]">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <!-- <SelectLabel>Fruits</SelectLabel> -->
                <SelectItem
                  v-for="item in nodeSelect.options"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <div class="control-group w-">
            <label for="threshold-slider-v2">
              Label Threshold:
              <span>{{ labelThreshold }}</span>
            </label>

            <Slider
              id="threshold-slider-v2"
              v-model="labelThreshold"
              @update:model-value="updateThreshold"
              :min="0"
              :max="10"
              :step="0.1"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>

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
    </div>
    {{ graphOptions }}
  </div>
</template>

<script setup lang="ts">
import { ForceGraph } from '@/lib/ForceGraph'
import { DefaultDataFetcher } from '../../interfaces/dataFetcher'
import { DataManager } from '../../interfaces/dataManager'
import { DefaultDataTransformer } from '../../interfaces/dataTransformer'
import { computed, onMounted, ref, watch } from 'vue'
import { useElementSize } from '@vueuse/core'
import Collapsible from './ui/collapsible/Collapsible.vue'
import CollapsibleTrigger from './ui/collapsible/CollapsibleTrigger.vue'
import Button from './ui/button/Button.vue'
import { ChevronsUpDown } from 'lucide-vue-next'
import CollapsibleContent from './ui/collapsible/CollapsibleContent.vue'
import Slider from './ui/slider/Slider.vue'
import type { GraphOptions, NodeData } from 'interfaces/types'
import Select from './ui/select/Select.vue'
import SelectTrigger from './ui/select/SelectTrigger.vue'
import SelectValue from './ui/select/SelectValue.vue'
import SelectContent from './ui/select/SelectContent.vue'
import SelectGroup from './ui/select/SelectGroup.vue'
import SelectLabel from './ui/select/SelectLabel.vue'
import SelectItem from './ui/select/SelectItem.vue'

const isOpen = ref(true)
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

// graph related data
let graph: ForceGraph
const graphContainer = ref<HTMLDivElement>()
const { width, height } = useElementSize(graphContainer)

const graphOptions = computed<GraphOptions>(() => ({
  width: width.value,
  height: height.value,
  // layout: "circlepack",
  labelThreshold: labelThreshold.value[0],
  keepDragPosition: true,
  noCollision: true,
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
const layout = ref<'force' | 'circlepack'>('force')
const initialData = {
  nodes: [],
  links: [],
}

// Create data management components
const dataFetcher = new DefaultDataFetcher()
const dataTransformer = new DefaultDataTransformer()
const dataManager = new DataManager(dataFetcher, dataTransformer)

onMounted(async () => {
  if (!graphContainer.value) return
  graph = new ForceGraph(graphContainer.value, initialData, graphOptions.value)

  // Set the data manager on the graph
  graph.setDataManager(dataManager)
  await loadMoreData()

  // Set up interval to check loading status
  setInterval(updateLoadingIndicator, 500)
})

// Function to update loading indicator
const updateLoadingIndicator = () => {
  // const loadingState = graph.getLoadingState()
  // const isLoading = loadingState.isCalculating
  const paginationInfo = {
    currentPage: dataManager.getCurrentPage(),
    totalPages: dataManager.getTotalPages(),
    isLastPage: dataManager.getIsLastPage(),
  }

  // renderLoading.value = isLoading

  // Update load more button state
  // loadMoreBtn.value.status = !(isLoading || !!paginationInfo?.isLastPage)

  // Update button text to show loading progress
  if (paginationInfo?.isLastPage) {
    loadMoreBtn.value.text = 'All Data Loaded'
    // } else if (isLoading) {
    //   loadMoreBtn.value.text = 'Loading...'
  } else {
    loadMoreBtn.value.text = `Load More Data (${
      paginationInfo?.currentPage || 0
    }/${paginationInfo?.totalPages || 5})`
  }
  loadMoreBtn.value.status = true

  // Update node selectbox if search is active
  if (nodeSearch.value) {
    populateNodeSelect(nodeSearch.value)
  }
}

// Function to populate node selectbox
const populateNodeSelect = (searchTerm: string = '') => {
  const graphData = graph.getData()
  const nodes = graphData.nodes || []

  // Clear existing options
  nodeSelect.value.selected = null

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
    const option = document.createElement('option')
    option.value = node.id.toString()

    const nodeLabel = node.label || node.id.toString()
    const platform = node.platform ? ` (${node.platform})` : ''
    option.textContent = `${nodeLabel}${platform}`

    // Add data attributes for additional info
    option.setAttribute('data-platform', node.platform || '')
    option.setAttribute('data-label', nodeLabel)

    nodeSelect.value.options.push(option)
  })

  // // Show/hide select based on search results
  // if (searchTerm && filteredNodes.length > 0) {
  //   nodeSelect.value.show = true
  // } else if (!searchTerm) {
  //   nodeSelect.value.show = false
  // }
}

// Function to focus on selected node
const focusOnNode = (nodeId: string) => {
  if (nodeId && graph.hasNode(nodeId)) {
    graph.focusPosition({ id: nodeId })

    // Clear search and hide select
    nodeSearch.value = ''
    // nodeSelect.value.show = false

    // Optional: Show feedback
    const node = graph.getNodeById(nodeId)
    if (node) {
      console.log(`Focused on node: ${node.label || nodeId}`)
    }
  } else {
    console.error('Node not found or invalid ID provided.')
  }
}

function toggleLayout() {
  layout.value = layout.value === 'force' ? 'circlepack' : 'force'
  graph.setLayout(layout.value as 'force' | 'circlepack')
}

function refreshGraph() {
  graph.refresh()
}

function resetGraph() {
  graph.resetGraph()
}

async function loadMoreData() {
  fetchLoading.value = true
  loadMoreBtn.value.status = false
  try {
    const newData = await dataManager.fetchNextPage()
    if (newData) {
      graph.addData(newData)
      nodeSelect.value.options.push(
        ...graph.getNodesData().map((node) => ({
          label: node.label || String(node.id),
          value: node.id.toString(),
        })),
      )
    }
    console.log('nodes', graph.getDataSize().nodes)
    console.log('links', graph.getDataSize().links)
    // console.log('size', graph.getSize());
  } catch (error) {
    console.error('Error fetching data:', error)
  }
  fetchLoading.value = false
  updateLoadingIndicator()
}

function updateThreshold() {
  // console.log('update threshold', labelThreshold.value[0])

  graph.setOptions({
    labelThreshold: labelThreshold.value[0],
  })
}

// Watch for changes in width and height from useElementSize
watch([width, height], (newVal, oldVal) => {
  // console.log('w', oldVal[0], newVal[0])
  // console.log('h', oldVal[1], newVal[1])

  if (
    newVal[0] > oldVal[0] - 10 &&
    newVal[0] < oldVal[0] + 10 &&
    newVal[1] > oldVal[1] - 10 &&
    newVal[1] < oldVal[1] + 10
  )
    return
  // console.log('Size changed:', { width: newVal[0], height: newVal[1] })
  if (!graphContainer.value) return

  // Store current graph data and options
  const currentData = graph?.getData() || initialData

  // Recreate graph with new dimensions
  graph = new ForceGraph(graphContainer.value, currentData, graphOptions.value)
  graph.setDataManager(dataManager)
})
</script>
