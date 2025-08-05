<template>
  <div class="p-6 space-y-8">
    <div class="text-center">
      <h1 class="text-3xl font-bold mb-2">Force Graph Curve Examples</h1>
      <p class="text-muted-foreground mb-2">
        Demonstrating link curvature and directional particles functionality
      </p>
      <div class="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md max-w-2xl mx-auto">
        <strong>API Design:</strong> Configure curves via constructor options for initial setup, 
        then use <code class="bg-background px-1 rounded">graph.renderer()</code> for direct access to all force-graph methods.
        No redundant wrapper methods needed!
      </div>
    </div>

    <!-- Example Selection -->
    <div class="flex flex-wrap gap-2 justify-center">
      <button
        v-for="(example, key) in examples"
        :key="key"
        @click="loadExample(key)"
        :class="[
          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
          currentExample === key
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        ]"
      >
        {{ example.name }}
      </button>
    </div>

    <!-- Current Example Info -->
    <div v-if="currentExampleInfo" class="bg-card p-4 rounded-lg border">
      <h3 class="font-semibold mb-2">{{ currentExampleInfo.name }}</h3>
      <p class="text-sm text-muted-foreground mb-3">{{ currentExampleInfo.description }}</p>
      <details class="text-sm">
        <summary class="cursor-pointer font-medium mb-2">View Code</summary>
        <pre class="bg-muted p-3 rounded text-xs overflow-x-auto"><code>{{ currentExampleInfo.code }}</code></pre>
      </details>
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
        <p>Nodes: {{ graph?.getDataSize().nodes || 0 }}</p>
        <p>Links: {{ graph?.getDataSize().links || 0 }}</p>
      </div>
    </div>

    <!-- Controls -->
    <div class="bg-card p-4 rounded-lg border space-y-4">
      <h3 class="font-semibold">Interactive Controls</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Curvature Control -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Global Curvature</label>
          <input
            v-model.number="controls.curvature"
            type="range"
            min="-1"
            max="1"
            step="0.1"
            class="w-full"
            @input="updateCurvature"
          />
          <span class="text-xs text-muted-foreground">{{ controls.curvature }}</span>
        </div>

        <!-- Particle Count -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Particles</label>
          <input
            v-model.number="controls.particles"
            type="range"
            min="0"
            max="10"
            step="1"
            class="w-full"
            @input="updateParticles"
          />
          <span class="text-xs text-muted-foreground">{{ controls.particles }}</span>
        </div>

        <!-- Particle Speed -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Particle Speed</label>
          <input
            v-model.number="controls.speed"
            type="range"
            min="0.001"
            max="0.1"
            step="0.001"
            class="w-full"
            @input="updateSpeed"
          />
          <span class="text-xs text-muted-foreground">{{ controls.speed.toFixed(3) }}</span>
        </div>

        <!-- Particle Width -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Particle Width</label>
          <input
            v-model.number="controls.width"
            type="range"
            min="1"
            max="10"
            step="0.5"
            class="w-full"
            @input="updateWidth"
          />
          <span class="text-xs text-muted-foreground">{{ controls.width }}</span>
        </div>

        <!-- Particle Color -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Particle Color</label>
          <input
            v-model="controls.color"
            type="color"
            class="w-full h-8 rounded border"
            @input="updateColor"
          />
        </div>

        <!-- Reset Button -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Actions</label>
          <button
            @click="resetControls"
            class="w-full px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80"
          >
            Reset Controls
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ForceGraph } from '@/lib/ForceGraph'
import { curveExamples } from '@/examples/curveExample'
import type { GraphData } from '../../interfaces/types'

// Reactive references
const graphContainer = ref<HTMLDivElement>()
const graph = ref<ForceGraph | null>(null)
const loading = ref(false)
const currentExample = ref<string>('basic')

// Controls
const controls = ref({
  curvature: 0.3,
  particles: 2,
  speed: 0.02,
  width: 4,
  color: '#ff6b6b'
})

// Example definitions
const examples = {
  basic: {
    name: 'Basic Curve',
    description: 'Simple curve usage with property-based curvature',
    code: `const graph = new ForceGraph(container)
  .linkDirectionalParticles(2)
  .linkCurvature('curvature')
  .graphData(data);`
  },
  functionBased: {
    name: 'Function-based',
    description: 'Dynamic curvature using functions',
    code: `const graph = new ForceGraph(container)
  .linkDirectionalParticles(link => link.curvature > 0.3 ? 4 : 1)
  .linkCurvature(link => link.curvature || Math.random() * 0.5)
  .graphData(data);`
  },
  fixed: {
    name: 'Fixed Curve',
    description: 'Fixed curvature value for all links',
    code: `const graph = new ForceGraph(container)
  .linkDirectionalParticles(3)
  .linkCurvature(0.3)
  .linkDirectionalParticleColor(link => sourceNode?.color || '#333')
  .graphData(data);`
  },
  advanced: {
    name: 'Advanced',
    description: 'Complex curve configuration with multiple parameters',
    code: `const graph = new ForceGraph(container, data, {
  linkCurvature: link => (hash % 3 - 1) * 0.4,
  linkDirectionalParticles: link => Math.floor(Math.abs(link.curvature) * 10) + 1,
  linkDirectionalParticleColor: link => curvature > 0 ? '#ff6b6b' : '#4ecdc4'
});`
  },
  conditional: {
    name: 'Conditional',
    description: 'Conditional curves based on link properties',
    code: `const graph = new ForceGraph(container)
  .linkDirectionalParticles(link => link.type === 'primary' ? 3 : 0)
  .linkCurvature(link => link.type === 'secondary' ? link.weight * 0.06 : 0)
  .graphData(data);`
  }
}

const currentExampleInfo = ref(examples[currentExample.value as keyof typeof examples])

// Load example function
const loadExample = async (exampleKey: string) => {
  if (!graphContainer.value) return
  
  loading.value = true
  currentExample.value = exampleKey
  currentExampleInfo.value = examples[exampleKey as keyof typeof examples]
  
  try {
    // Destroy existing graph
    if (graph.value) {
      graph.value.destroy()
    }
    
    // Create new graph with selected example
    graph.value = curveExamples[exampleKey as keyof typeof curveExamples](graphContainer.value)
    
    // Reset controls to match the example
    resetControls()
  } catch (error) {
    console.error('Error loading example:', error)
  } finally {
    loading.value = false
  }
}

// Control update functions
const updateCurvature = () => {
  if (graph.value) {
    graph.value.renderer().linkCurvature(controls.value.curvature)
  }
}

const updateParticles = () => {
  if (graph.value) {
    graph.value.renderer().linkDirectionalParticles(controls.value.particles)
  }
}

const updateSpeed = () => {
  if (graph.value) {
    graph.value.renderer().linkDirectionalParticleSpeed(controls.value.speed)
  }
}

const updateWidth = () => {
  if (graph.value) {
    graph.value.renderer().linkDirectionalParticleWidth(controls.value.width)
  }
}

const updateColor = () => {
  if (graph.value) {
    graph.value.renderer().linkDirectionalParticleColor(controls.value.color)
  }
}

const resetControls = () => {
  controls.value = {
    curvature: 0.3,
    particles: 2,
    speed: 0.02,
    width: 4,
    color: '#ff6b6b'
  }
}

// Lifecycle
onMounted(() => {
  // Load the basic example by default
  loadExample('basic')
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