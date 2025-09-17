<template>
  <Sheet v-model:open="isOpen">
    <SheetTrigger as-child>
      <Button variant="secondary">
        API Settings
        <Settings class="h-4 w-4" />
      </Button>
    </SheetTrigger>
    <SheetContent side="right" class="max-w-sm sm:max-w-xl p-4 pb-0 gap-2">
      <SheetHeader class="p-2">
        <SheetTitle>API Settings</SheetTitle>
        <SheetDescription>
          Configure your API endpoint and access token. Settings are saved locally.
        </SheetDescription>
      </SheetHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4 p-2 overflow-y-auto py-4">
        <div class="space-y-2">
          <Label for="endpoint">API Endpoint</Label>
          <Input
            id="endpoint"
            name="endpoint"
            type="url"
            autocomplete="url"
            placeholder="https://api.example.com"
            required
            v-model="formData.endpoint"
          />
        </div>

        <div class="space-y-2">
          <Label for="accessToken">Access Token</Label>
          <div class="relative">
            <Input
              id="accessToken"
              name="accessToken"
              :type="showToken ? 'text' : 'password'"
              placeholder="Enter your access token"
              class="pr-10"
              required
              v-model="formData.accessToken"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              @click="toggleTokenVisibility"
            >
              <Eye v-if="!showToken" class="h-4 w-4" />
              <EyeOff v-else class="h-4 w-4" />
              <span class="sr-only">
                {{ showToken ? 'Hide token' : 'Show token' }}
              </span>
            </Button>
          </div>
        </div>

        <Collapsible v-model:open="expandBodyParams" class="space-y-2 -mx-2">
          <CollapsibleTrigger as-child>
            <Button variant="ghost" size="sm" class="w-full justify-between">
              Body Params

              <ChevronsUpDown class="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent class="space-y-2 px-2">
            <JsonEditorVue v-model="formData.params" name="body-params" :main-menu-bar="false" />
          </CollapsibleContent>
        </Collapsible>

        <!-- History Section -->
        <RecentSetting
          v-if="settingsHistory.length"
          :HISTORY_KEY="API_STORAGE_KEYS.HISTORY"
          v-model:form-data="formData"
          v-model:settings-history="settingsHistory"
        />

        <SheetFooter class="flex-row flex-wrap gap-2 p-0">
          <Button type="submit" :disabled="isLoading" class="flex-1">
            <span v-if="isLoading">Saving...</span>
            <span v-else>Save Settings</span>
          </Button>
          <Button type="button" variant="outline" @click="undo" :disabled="isLoading">
            Undo
          </Button>
          <Button type="button" variant="outline" @click="redo" :disabled="isLoading">
            Redo
          </Button>
          <Button
            type="button"
            variant="outline"
            @click="handleReset"
            :disabled="isLoading"
            class="border-orange-500 dark:border-orange-500 text-orange-500"
          >
            Reset
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { ref, onMounted, toRaw } from 'vue'
import { Settings, Eye, EyeOff, ChevronsUpDown } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@docs/components/ui/sheet'
import { Button } from '@docs/components/ui/button'
import { Input } from '@docs/components/ui/input'
import { Label } from '@docs/components/ui/label'
import JsonEditorVue from 'json-editor-vue'
// import { useGraphContext } from '@docs/context/graphContext'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { useRefHistory, useStorage, type UseRefHistoryRecord } from '@vueuse/core'
import RecentSetting, { type HistorySetting } from './RecentSetting.vue'
import { API_STORAGE_KEYS, useGraphContext } from '@docs/context/graphContext'

// Graph context state
const { apiSetting } = useGraphContext()
// console.log(params.value)

// Component state
const isOpen = ref(false)
const expandBodyParams = ref(true)
const isLoading = ref(false)
const showToken = ref(false)
const formData = ref<typeof apiSetting.value>(apiSetting.value)

const { history, undo, redo } = useRefHistory<HistorySetting | undefined>(apiSetting, {
  capacity: 5,
})

const settingsHistory = ref<UseRefHistoryRecord<HistorySetting>[]>([])

// Load saved settings from localStorage
const loadSettings = () => {
  const { endpoint, accessToken, params } = apiSetting.value

  if (endpoint) {
    formData.value.endpoint = endpoint
  }
  if (accessToken) {
    formData.value.accessToken = accessToken
  }
  if (Object.values(params).length) {
    formData.value.params = params
  }
}

// Save current settings to history (max 5 items)
const saveToHistory = () => {
  if (!history.value[0].snapshot) history.value[0].snapshot = toRaw(apiSetting.value)
  history.value.forEach((historyItem, key) => {
    history.value[key] = {
      ...historyItem,
      snapshot: toRaw(historyItem.snapshot),
    }
  })
  // console.log(toRaw(history.value))
  // if (!history.value.length) return

  // const mergedHistories = [...history.value, ...settingsHistory.value]
  const mergedHistories = [...new Set([...toRaw(history.value), ...toRaw(settingsHistory.value)])]
  console.log('mergedHistories', mergedHistories)

  // Save to localStorage
  localStorage.setItem(API_STORAGE_KEYS.HISTORY, JSON.stringify(mergedHistories))
}

;(() => {
  const savedHistory = localStorage.getItem(API_STORAGE_KEYS.HISTORY)

  if (savedHistory) {
    try {
      const parsedHistories: typeof settingsHistory.value = JSON.parse(savedHistory || '[]')

      const haveSnapshot = 'snapshot' in parsedHistories[0]
      const haveTimestamp = 'timestamp' in parsedHistories[0]
      // console.log(parsedHistories, haveSnapshot, haveTimestamp)

      if (haveSnapshot && haveTimestamp) settingsHistory.value = parsedHistories
    } catch (error) {
      console.error('Failed to parse settings history:', error)
      settingsHistory.value = []
    }

    // console.log(settingsHistory.value)
  }
})()

// Save settings to localStorage
const saveSettings = () => {
  apiSetting.value = { ...formData.value }
}

// Toggle token visibility
const toggleTokenVisibility = () => {
  showToken.value = !showToken.value
}

// Reset form and clear saved settings
const handleReset = () => {
  // Clear form data
  formData.value.endpoint = ''
  formData.value.accessToken = ''

  // Clear localStorage
  apiSetting.value = {
    accessToken: '',
    endpoint: '',
    params: {
      size: '100',
      sentiment_selected: 'linguistik',
      dateStart: new Date(new Date().setDate(new Date().getDate() - 30))
        .toISOString()
        .substring(0, 10),
      dateStop: new Date().toISOString().substring(0, 10),
      platforms: ['facebook', 'instagram', 'tiktok', 'twitter', 'youtube'],
      sentiment: [-1, 0, 1],
      prokontra: [-1, 0, 1],
      keywords: [],
    },
  }

  // Hide token for security
  showToken.value = false

  // Show success toast
  toast.success('Settings reset successfully!', {
    description: 'Form and saved settings have been cleared.',
  })
}

// Handle form submission
const handleSubmit = async () => {
  isLoading.value = true

  try {
    // Save to localStorage
    saveSettings()

    // Save to history
    saveToHistory()

    // Show success toast
    toast.success('API settings saved successfully!', {
      description: 'Your endpoint and access token have been saved locally.',
    })

    // Close the sheet
    isOpen.value = false
  } catch (error) {
    toast.error('Failed to save settings', {
      description: 'Please try again.',
    })
  } finally {
    isLoading.value = false
  }
}

// Load settings on component mount
onMounted(() => {
  loadSettings()
})
</script>
