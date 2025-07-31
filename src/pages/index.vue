<template>
  <div>
    <!-- <div class="control-group">
      <h4>Platform Colors</h4>
      <div class="color-legend">
        <div class="legend-item">
          <span class="color-dot" style="background: #fa8f21"></span>
          <span>Keyword of Topic</span>
        </div>
        <div class="legend-item">
          <span class="color-dot" style="background: #1877f2"></span>
          <span>Facebook</span>
        </div>
        <div class="legend-item">
          <span class="color-dot" style="background: #55acee"></span>
          <span>Twitter/X</span>
        </div>
        <div class="legend-item">
          <span class="color-dot" style="background: #dc2391"></span>
          <span>Instagram</span>
        </div>
        <div class="legend-item">
          <span class="color-dot" style="background: #f00"></span>
          <span>Youtube</span>
        </div>
        <div class="legend-item">
          <span class="color-dot" style="background: #f3f4f6"></span>
          <span>Tiktok</span>
        </div>
      </div>
    </div> -->

    <Demo />

    <!-- <ForceGraph
      ref="forceGraphRef"
      :data="graphData"
      :options="graphOptions"
      :data-manager="dataManager"
      height="500px"
      @node-click="handleNodeClick"
    /> -->

    <!-- Legacy container for backward compatibility -->
    <!-- <div class="">
      <div class="">
        <div class="bg-muted-foreground/10 rounded-md p-4 flex gap-2">
          <h3>Graph Controls</h3>

          <div class="control-group">
            <p style="margin-bottom: 8px">Layout Type</p>
            <Button id="layout-toggle"> Toggle Layout </Button>
          </div>

          <div class="control-group flex gap-2">
            <Button id="refresh-btn">Refresh Graph</Button>
            <Button id="reset-btn">Reset Graph</Button>
            <Button id="load-more-btn">Load More Data</Button>
          </div>

          <div class="control-group">
            <label>Label Threshold</label>
            <input
              type="range"
              id="threshold-slider"
              class="slider"
              min="0"
              max="3"
              step="0.1"
              value="1.2"
            />
          </div>

          <div class="control-group">
            <label for="node-search">Focus on Node</label>
            <div class="search-container">
              <input type="text" id="node-search" placeholder="Search nodes..." />
              <select id="node-select" size="5" style="display: none"></select>
            </div>
          </div>
        </div>

        <div id="graph-container" style="width: 100%; height: 600px; background-color: white"></div>
      </div>

      <div id="loading-indicator">Calculating...</div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import ForceGraph from '../components/ForceGraph.vue'
import Button from '@/components/ui/button/Button.vue'
import Demo from '@/components/demo.vue'
import { DefaultDataFetcher } from '../../interfaces/dataFetcher'
import { DefaultDataTransformer } from '../../interfaces/dataTransformer'
import { DataManager } from '../../interfaces/dataManager'
import type { GraphData, GraphOptions, NodeData } from '../../interfaces/types'

// Refs
const forceGraphRef = ref<InstanceType<typeof ForceGraph> | null>(null)
const layout = ref<'force' | 'circlepack'>('force')
const labelThreshold = ref([1.2])

// Data management
let dataFetcher: DefaultDataFetcher
let dataTransformer: DefaultDataTransformer
let dataManager: DataManager

// Graph data and options
const graphData = reactive<GraphData>({
  nodes: [],
  links: [],
})

const graphOptions = reactive<GraphOptions>({
  layout: layout.value,
  labelThreshold: labelThreshold.value[0],
  keepDragPosition: true,
})

// Methods
const toggleLayout = () => {
  layout.value = layout.value === 'force' ? 'circlepack' : 'force'
  graphOptions.layout = layout.value
}

const updateThreshold = () => {
  graphOptions.labelThreshold = labelThreshold.value[0]
}

const refreshGraph = () => {
  forceGraphRef.value?.refresh()
}

const resetGraph = () => {
  if (!dataManager) return
  dataManager.reset()
  graphData.nodes = []
  graphData.links = []
}

const loadMoreData = async () => {
  if (!dataManager) return

  try {
    const newData = await dataManager.fetchNextPage()
    if (newData) {
      // Update the reactive data
      graphData.nodes = [...graphData.nodes, ...newData.nodes]
      graphData.links = [...graphData.links, ...newData.links]
    }
  } catch (error) {
    console.error('Error loading more data:', error)
  }
}

const handleNodeClick = (node: NodeData) => {
  console.log('Node clicked:', node)
}

// Lifecycle hooks
onMounted(() => {
  // Create data management components
  dataFetcher = new DefaultDataFetcher()
  dataTransformer = new DefaultDataTransformer()
  dataManager = new DataManager(dataFetcher, dataTransformer)

  // Load initial data
  loadMoreData()
})
</script>
