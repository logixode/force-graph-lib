<template>
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
          <Button id="refresh-btn-v2" @click="refreshGraph">Refresh Graph</Button>
        </div>

        <div class="control-group">
          <Button id="reset-btn-v2" @click="resetGraph">Reset Graph</Button>
        </div>

        <div class="control-group">
          <Button
            id="load-more-btn-v2"
            :disabled="!loadMoreBtn.status || isFetching"
            @click="loadMoreData"
          >
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
            <SelectValue placeholder="Select a node" />
          </SelectTrigger>

          <SelectContent>
            <InputGroup class="mb-1">
              <Input
                type="text"
                id="search_country_code"
                name="search_country_code"
                placeholder="Search..."
                class="pl-8 pr-2 py-1 w-full text-sm"
                autocomplete="off"
                aria-label="Search country"
                v-model="search"
                @update:model-value="searchDebounce"
                @keydown.stop
              />
              <template #left>
                <Search :size="18" />
              </template>
            </InputGroup>

            <ListboxRoot>
              <ListboxContent class="max-h-56 w-80 overflow-y-auto">
                <ListboxVirtualizer
                  v-slot="{ option }"
                  :options="filteredNodes"
                  :estimate-size="40"
                >
                  <SelectItem
                    :value="option.value"
                    class="flex items-center gap-2 max-h-11 line-clamp-2"
                    v-memo="[option.value, option.label]"
                  >
                    {{ option.label }}
                  </SelectItem>
                </ListboxVirtualizer>
              </ListboxContent>
            </ListboxRoot>
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
</template>

<script setup lang="ts">
import { ref, inject, watch } from 'vue'
import Collapsible from './ui/collapsible/Collapsible.vue'
import CollapsibleTrigger from './ui/collapsible/CollapsibleTrigger.vue'
import Button from './ui/button/Button.vue'
import { ChevronsUpDown, Search } from 'lucide-vue-next'
import CollapsibleContent from './ui/collapsible/CollapsibleContent.vue'
import Slider from './ui/slider/Slider.vue'
import Select from './ui/select/Select.vue'
import SelectTrigger from './ui/select/SelectTrigger.vue'
import SelectValue from './ui/select/SelectValue.vue'
import SelectContent from './ui/select/SelectContent.vue'
import SelectItem from './ui/select/SelectItem.vue'
import type { GraphContext } from '../types/graph-context'
import Input from './ui/input/Input.vue'
import InputGroup from './ui/input/InputGroup.vue'
import { ListboxContent, ListboxRoot, ListboxVirtualizer } from 'reka-ui'
import { useDebounceFn, useMemoize } from '@vueuse/core'
import { useFetchGraph } from '@/composeables/useFetchGraph'
import type { GraphData } from 'interfaces/types'

// Inject the graph context from parent component
const graphContext = inject<GraphContext>('graphContext')
const { data, page, isFetching, isLoading, promise, endpoint, accessToken, reset, loadNextPage } =
  useFetchGraph()

if (!graphContext) {
  throw new Error('GraphOptions must be used within a component that provides graphContext')
}

const {
  graph,
  pagination,
  dataManager,
  labelThreshold,
  loadMoreBtn,
  nodeSelect,
  fetchLoading,
  updateLoadingIndicator,
} = graphContext

// Local state
const isOpen = ref(true)
const search = ref<string>('')
const filteredNodes = ref<typeof nodeSelect.value.options>(nodeSelect.value.options)
const searchDebounce = useDebounceFn((val) => {
  filteredNodes.value = filterNodes(val)
}, 350)

// Methods
const filterNodes = useMemoize((searchVal: string) => {
  if (!searchVal) return nodeSelect.value.options
  const q = searchVal.toLowerCase().trim()

  // filter by label name or id/input value
  return nodeSelect.value.options.filter((option) => {
    const nameMatch = option.label.toLowerCase().includes(q)
    const idMatch = option.value.toLowerCase().includes(q)
    return nameMatch || idMatch
  })
})

function refreshGraph() {
  graph.value?.refreshGraph()
}

function resetGraph() {
  graph.value?.reset()
  reset()
}

async function loadMoreData() {
  fetchLoading.value = true
  loadMoreBtn.value.status = false

  try {
    let newData: GraphData | null = null
    if (endpoint && accessToken) {
      // Use the helper function that handles page increment and waiting
      const result = await loadNextPage()
      newData = result?.data ?? null
      pagination.value = result?.pagination ?? null
      console.log('result', result?.data)
    } else if (dataManager.value) {
      newData = await dataManager.value.fetchNextPage()
    }
    console.log(newData)

    if (newData && graph.value) {
      console.log(newData)
      graph.value.addData(newData)
      nodeSelect.value.options.push(
        ...graph.value.getNodesData().map((node) => ({
          label: node.label || String(node.id),
          value: node.id.toString(),
        })),
      )
    }
  } catch (error) {
    console.error('Error fetching data:', error)
  }
  fetchLoading.value = false
  updateLoadingIndicator()
}

function updateThreshold() {
  graph.value?.setOptions({
    labelThreshold: labelThreshold.value[0],
  })
}

function focusOnNode(nodeId: string) {
  if (!graph.value) return

  if (nodeId && graph.value.hasNode(nodeId)) {
    graph.value.focusPosition({ id: nodeId })

    // Optional: Show feedback
    const node = graph.value.getNodeById(nodeId)
    if (node) {
      console.log(`Focused on node: ${node.label || nodeId}`)
    }
  } else {
    console.error('Node not found or invalid ID provided.')
  }
}
</script>
