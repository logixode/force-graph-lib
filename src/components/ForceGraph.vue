<template>
  <div ref="container" class="force-graph-container" :style="containerStyle"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { ForceGraph as ForceGraphLib } from '../lib/ForceGraph';
import type { GraphData, GraphOptions, NodeData } from '../../interfaces/types';
import type { DataManager } from '../../interfaces/dataManager';

// Props
const props = defineProps<{
  data?: GraphData;
  options?: GraphOptions;
  dataManager?: DataManager;
  width?: number | string;
  height?: number | string;
}>();

// Emits
const emit = defineEmits<{
  'node-click': [node: NodeData];
  'update:data': [data: GraphData];
}>();

// Refs
const container = ref<HTMLElement | null>(null);
let graph: ForceGraphLib | null = null;

// Computed
const containerStyle = computed(() => {
  return {
    width: typeof props.width === 'number' ? `${props.width}px` : props.width || '100%',
    height: typeof props.height === 'number' ? `${props.height}px` : props.height || '400px',
  };
});

// Methods
const initGraph = () => {
  if (!container.value) return;
  
  // Initialize graph with provided data or empty data
  const initialData = props.data || { nodes: [], links: [] };
  
  // Create graph instance
  graph = new ForceGraphLib(
    container.value,
    initialData,
    {
      width: container.value.clientWidth,
      height: container.value.clientHeight,
      ...props.options,
      // Custom event handler for node clicks
      nodeClickHandler: (node) => {
        emit('node-click', node);
      }
    },
    props.dataManager
  );
};

// Expose methods to parent components
defineExpose({
  refresh: () => graph?.refresh(),
  setOptions: (options: GraphOptions) => graph?.setOptions(options),
  updateData: (data: GraphData) => graph?.updateData(data),
  focusPosition: (nodeData: { id?: string; x?: number; y?: number }) => graph?.focusPosition(nodeData),
});

// Lifecycle hooks
onMounted(() => {
  initGraph();
});

onUnmounted(() => {
  // Clean up
  graph = null;
});

// Watch for data changes
watch(
  () => props.data,
  (newData) => {
    if (newData && graph) {
      graph.updateData(newData);
    }
  },
  { deep: true }
);

// Watch for options changes
watch(
  () => props.options,
  (newOptions) => {
    if (newOptions && graph) {
      graph.setOptions(newOptions);
    }
  },
  { deep: true }
);
</script>

<style scoped>
.force-graph-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>