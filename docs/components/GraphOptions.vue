<template>
  <Collapsible v-model:open="isOpen" class="space-y-2 bg-card shadow-xl rounded-md mb-2">
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

        <div class="control-group">
          <Button
            id="auto-load-btn-v2"
            :disabled="!loadMoreBtn.status || isFetching || isAutoLoading"
            @click="startAutoLoad"
            variant="outline"
          >
            <Play class="h-4 w-4 mr-1" />
            Auto Load
          </Button>
        </div>

        <div class="control-group">
          <Button
            id="stop-auto-load-btn-v2"
            :disabled="!isAutoLoading"
            @click="stopAutoLoad"
            variant="destructive"
          >
            <Square class="h-4 w-4 mr-1" />
            Stop Auto
          </Button>
        </div>

        <ApiSetting />
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
      </div>

      <!-- Controls Section -->
      <div class="space-y-4 border-t">
        <h3 class="text-lg font-semibold">Controls</h3>

        <div class="grid md:grid-cols-2 gap-3">
          <div class="md:col-span-2">
            <label for="threshold-slider-v2" class="block text-sm font-medium mb-1">
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

          <!-- Enable/Disable Groups -->
          <div class="flex space-x-2">
            <Checkbox
              id="show-groups-checkbox"
              class="size-5"
              v-model="showGroups"
              @update:modelValue="toggleGroups"
            />
            <label for="show-groups-checkbox" class="text-sm font-medium">Show Groups</label>
          </div>

          <div class="flex space-x-2">
            <Checkbox
              id="enable-node-click"
              class="size-5"
              v-model="enableClick"
              @update:modelValue="toggleClickHandler"
            />
            <label for="enable-node-click" class="text-sm font-medium"
              >Enable Node Click (disabled for performance)</label
            >
          </div>

          <div class="flex space-x-2">
            <Checkbox
              id="enable-node-drag"
              class="size-5"
              :disabled="!enableClick"
              v-model="enableDrag"
              @update:modelValue="toggleDragHandler"
            />
            <label
              for="enable-node-drag"
              :class="['text-sm font-medium', { 'text-muted-foreground': !enableClick }]"
              >Enable Drag Node</label
            >
          </div>
        </div>

        <!-- Group By Options -->
        <div class="space-y-2">
          <label class="block text-sm font-medium">Group By:</label>
          <Select
            v-model="groupByOption"
            @update:modelValue="changeGroupBy"
            :disabled="!showGroups"
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Select grouping criteria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="topic">Topic</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Group Style Options -->
        <div class="space-y-3 grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">
              Border Width: <span class="text-xs text-gray-500">{{ groupBorderWidth[0] }}px</span>
            </label>
            <Slider
              v-model="groupBorderWidth"
              @update:model-value="updateGroupStyle"
              :min="1"
              :max="5"
              :step="1"
              :disabled="!showGroups"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">
              Border Opacity:
              <span class="text-xs text-gray-500">{{ groupBorderOpacity[0] }}</span>
            </label>
            <Slider
              v-model="groupBorderOpacity"
              @update:model-value="updateGroupStyle"
              :min="0.1"
              :max="1"
              :step="0.1"
              :disabled="!showGroups"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">
              Label Size: <span class="text-xs text-gray-500">{{ groupLabelSize[0] }}px</span>
            </label>
            <Slider
              v-model="groupLabelSize"
              @update:model-value="updateGroupStyle"
              :min="12"
              :max="24"
              :step="1"
              :disabled="!showGroups"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">
              Padding: <span class="text-xs text-gray-500">{{ groupPadding[0] }}px</span>
            </label>
            <Slider
              v-model="groupPadding"
              @update:model-value="updateGroupStyle"
              :min="10"
              :max="50"
              :step="5"
              :disabled="!showGroups"
            />
          </div>
        </div>

        <!-- Group Information -->
        <div v-if="showGroups && groups.length > 0" class="space-y-2">
          <h4 class="text-sm font-medium">Groups ({{ groups.length }})</h4>
          <div class="space-y-1 max-h-32 overflow-y-auto">
            <div
              v-for="group in groups"
              :key="group.id"
              class="flex justify-between items-center p-2 bg-muted rounded text-xs"
            >
              <span class="font-medium">{{ group.id }}</span>
              <span class="text-muted-foreground">{{ group.nodeCount }} nodes</span>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>

<script setup lang="ts">
import { ref, inject, watch, onUnmounted, computed } from 'vue'
import Collapsible from './ui/collapsible/Collapsible.vue'
import CollapsibleTrigger from './ui/collapsible/CollapsibleTrigger.vue'
import Button from './ui/button/Button.vue'
import { ChevronsUpDown, Search, Play, Square } from 'lucide-vue-next'
import CollapsibleContent from './ui/collapsible/CollapsibleContent.vue'
import Slider from './ui/slider/Slider.vue'
import Select from './ui/select/Select.vue'
import SelectTrigger from './ui/select/SelectTrigger.vue'
import SelectValue from './ui/select/SelectValue.vue'
import SelectContent from './ui/select/SelectContent.vue'
import SelectItem from './ui/select/SelectItem.vue'
import Input from './ui/input/Input.vue'
import InputGroup from './ui/input/InputGroup.vue'
import { ListboxContent, ListboxRoot, ListboxVirtualizer } from 'reka-ui'
import { useDebounceFn, useMemoize } from '@vueuse/core'
import { useFetchGraph } from '@docs/composables/useFetchGraph'
import type { GraphData } from 'interfaces/types'
import { useGraphContext } from '@docs/context/graphContext'
import { Checkbox } from './ui/checkbox'
import ApiSetting from './ApiSetting.vue'

// Inject the graph context from parent component

const graphContext = useGraphContext()
const { data, isFetching, isLoading, promise, endpoint, accessToken, reset, loadNextPage } =
  useFetchGraph(graphContext.apiSetting)

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

// Auto-loading state
const isAutoLoading = ref(false)
const autoLoadInterval = ref<NodeJS.Timeout | null>(null)
const autoLoadDelay = 2000 // 2 seconds between auto loads

// Group controls state
const showGroups = ref(false)
const enableClick = ref(false)
const enableDrag = ref(true)
const groupByOption = ref('topic')
const groupBorderWidth = ref([2])
const groupBorderOpacity = ref([0.4])
const groupLabelSize = ref([18])
const groupPadding = ref([25])

// Computed properties
const groups = computed(() => {
  if (!graph.value || !showGroups.value) return []

  const groupIds = graph.value.getGroups()
  return groupIds.map((id) => ({
    id,
    nodeCount: graph.value!.getNodesInGroup(id).length,
  }))
})

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
        }))
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

async function startAutoLoad() {
  if (isAutoLoading.value) return

  isAutoLoading.value = true
  console.log('Starting auto-load...')

  const autoLoadNext = async () => {
    try {
      // Check if we can still load more data
      if (!loadMoreBtn.value.status || isFetching.value) {
        console.log('Auto-load stopped: no more data available or currently fetching')
        stopAutoLoad()
        return
      }

      await loadMoreData()

      // Schedule next load if still auto-loading
      if (isAutoLoading.value) {
        autoLoadInterval.value = setTimeout(autoLoadNext, autoLoadDelay)
      }
    } catch (error) {
      console.error('Auto-load error:', error)
      stopAutoLoad()
    }
  }

  // Start the first auto-load
  autoLoadInterval.value = setTimeout(autoLoadNext, autoLoadDelay)
}

function stopAutoLoad() {
  if (!isAutoLoading.value) return

  isAutoLoading.value = false
  if (autoLoadInterval.value) {
    clearTimeout(autoLoadInterval.value)
    autoLoadInterval.value = null
  }
  console.log('Auto-load stopped')
}

// Group control methods
function toggleGroups() {
  if (!graph.value) return
  graph.value.showGroups(showGroups.value)
}

function toggleClickHandler() {
  if (!graph.value) return

  console.log('click akan', enableClick.value)

  graph.value.renderer().enablePointerInteraction(enableClick.value)
}
function toggleDragHandler() {
  if (!graph.value) return
  graph.value.renderer().enableNodeDrag(enableDrag.value)
}

function changeGroupBy() {
  if (!graph.value) return

  switch (groupByOption.value) {
    case 'platform':
      graph.value.setGroupBy('platform')
      break
    case 'topic':
      graph.value.setGroupBy('topic')
      break
  }
}

function updateGroupStyle() {
  if (!graph.value) return

  graph.value.setGroupOptions({
    borderWidth: Number(groupBorderWidth.value[0]),
    borderOpacity: Number(groupBorderOpacity.value[0]),
    labelSize: Number(groupLabelSize.value[0]),
    padding: Number(groupPadding.value[0]),
  })
}

// Cleanup on component unmount
onUnmounted(() => {
  stopAutoLoad()
})
</script>
