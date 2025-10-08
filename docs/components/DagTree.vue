<template>
  <div class="p-6 space-y-8">
    <div class="text-center">
      <h1 class="text-3xl font-bold mb-2">Graph Visualization</h1>
      <p class="text-muted-foreground mb-2">
        Interactive graph visualization with customizable controls
      </p>
      <div class="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md max-w-2xl mx-auto">
        <strong>Graph Controls:</strong> Adjust node and link properties to customize the
        visualization. Use <code class="bg-background px-1 rounded">graph.renderer()</code> for
        direct access to all force-graph methods for advanced customization!
      </div>
    </div>

    <!-- Graph Container -->
    <div class="w-full h-[600px] bg-card/50 shadow-xl rounded-md p-2 relative border">
      <div ref="graphContainer" class="w-full h-full" />

      <!-- Loading indicator -->
      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center bg-background/70"
      >
        <div class="flex gap-2 animate-pulse items-center">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          Loading example...
        </div>
      </div>

      <!-- Graph info -->
      <div class="absolute bottom-2 left-3 text-xs text-muted-foreground">
        <p>Nodes: {{ graphData.nodes.length }}</p>
        <p>Links: {{ graphData.links.length }}</p>
      </div>
    </div>

    <!-- Controls -->
    <div class="bg-card p-4 rounded-lg border space-y-4">
      <h3 class="font-semibold">Graph Controls</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Node Strength -->
        <div class="space-y-2">
          <Label class="text-sm font-medium">Node Repulsion</Label>
          <Slider
            :model-value="[controls.nodeStrength]"
            @update:model-value="
              (value) => {
                if (value && value[0] !== undefined) {
                  controls.nodeStrength = value[0]
                  updateNodeStrength()
                }
              }
            "
            :min="-1000"
            :max="-10"
            :step="10"
            class="w-full"
          />
          <span class="text-xs text-muted-foreground">{{ controls.nodeStrength }}</span>
        </div>

        <!-- Link Distance -->
        <div class="space-y-2">
          <Label class="text-sm font-medium">Link Distance</Label>
          <Slider
            :model-value="[controls.linkDistance]"
            @update:model-value="
              (value) => {
                if (value && value[0] !== undefined) {
                  controls.linkDistance = value[0]
                  updateLinkDistance()
                }
              }
            "
            :min="30"
            :max="200"
            :step="10"
            class="w-full"
          />
          <span class="text-xs text-muted-foreground">{{ controls.linkDistance }}</span>
        </div>

        <!-- Node Size -->
        <div class="space-y-2">
          <Label class="text-sm font-medium">Node Size</Label>
          <Slider
            :model-value="[controls.nodeSize]"
            @update:model-value="
              (value) => {
                if (value && value[0] !== undefined) {
                  controls.nodeSize = value[0]
                  updateNodeSize()
                }
              }
            "
            :min="2"
            :max="20"
            :step="1"
            class="w-full"
          />
          <span class="text-xs text-muted-foreground">{{ controls.nodeSize }}</span>
        </div>

        <!-- DAG Level Distance -->
        <div class="space-y-2">
          <Label class="text-sm font-medium">DAG Level Distance</Label>
          <Slider
            :model-value="[controls.dagLevelDistance]"
            @update:model-value="
              (value) => {
                if (value && value[0] !== undefined) {
                  controls.dagLevelDistance = value[0]
                  updateDagLevelDistance()
                }
              }
            "
            :min="50"
            :max="300"
            :step="10"
            class="w-full"
          />
          <span class="text-xs text-muted-foreground">{{ controls.dagLevelDistance }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ForceGraph } from '@/lib/ForceGraph'
import type { NodeData } from '../../interfaces/types'
import { Slider } from './ui/slider'
import { Label } from './ui/label'

// Reactive references
const graphContainer = ref<HTMLDivElement>()
const graph = ref<ForceGraph | null>(null)
const loading = ref(false)

// Control values
const controls = ref({
  nodeStrength: -300,
  linkDistance: 80,
  nodeSize: 8,
  dagLevelDistance: 100
})

// Simple graph data
const graphData = {
  nodes: [
    { id: 'root', name: 'Root', type: 'root' },
    { id: 'a', name: 'Node A', type: 'child' },
    { id: 'b', name: 'Node B', type: 'child' },
    { id: 'a1', name: 'Node A1', type: 'grandchild' },
    { id: 'a2', name: 'Node A2', type: 'grandchild' },
    { id: 'b1', name: 'Node B1', type: 'grandchild' },
    { id: 'b2', name: 'Node B2', type: 'grandchild' },
  ],
  links: [
    { source: 'root', target: 'a' },
    { source: 'root', target: 'b' },
    { source: 'a', target: 'a1' },
    { source: 'a', target: 'a2' },
    { source: 'b', target: 'b1' },
    { source: 'b', target: 'b2' },
  ],
}

// Node color mapping
const getNodeColor = (nodeType: string) => {
  const colors = {
    root: '#dc2626',
    child: '#2563eb',
    grandchild: '#16a34a',
  }
  return colors[nodeType as keyof typeof colors] || '#6b7280'
}

// Initialize graph
const initGraph = () => {
  if (!graphContainer.value) return

  loading.value = true

  try {
    graph.value = new ForceGraph(graphContainer.value, graphData, {
      width: graphContainer.value.clientWidth,
      height: graphContainer.value.clientHeight,
      nodeSize: controls.value.nodeSize,
      nodeColor: (node: any) => getNodeColor(node.type || 'default'),
      nodeLabel: (node: any) => node.name || node.id.toString(),
      linkWidth: 2,
    })

    // Set arrow properties
    graph.value
      .renderer()
      .dagMode('td')
      .dagLevelDistance(controls.value.dagLevelDistance)
      .linkDirectionalArrowLength(6)
      .linkDirectionalArrowRelPos(1)
      .linkColor('#64748b')

    // Apply initial forces
    updateNodeStrength()
    updateLinkDistance()
  } catch (error) {
    console.error('Error initializing graph:', error)
  } finally {
    loading.value = false
  }
}

// Control update functions
const updateNodeStrength = () => {
  if (graph.value) {
    graph.value.renderer().d3Force('charge')?.strength(controls.value.nodeStrength)
    graph.value.renderer().d3ReheatSimulation()
  }
}

const updateLinkDistance = () => {
  if (graph.value) {
    graph.value.renderer().d3Force('link')?.distance(controls.value.linkDistance)
    graph.value.renderer().d3ReheatSimulation()
  }
}

const updateNodeSize = () => {
  if (graph.value) {
    graph.value.renderer().nodeVal(controls.value.nodeSize)
  }
}

const updateDagLevelDistance = () => {
  if (graph.value) {
    graph.value.renderer().dagLevelDistance(controls.value.dagLevelDistance)
  }
}

// Lifecycle
onMounted(() => {
  initGraph()
})

onUnmounted(() => {
  if (graph.value) {
    graph.value.destroy()
  }
})
</script>

<style scoped>
/* Add any custom styles here */
</style>