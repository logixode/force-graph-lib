<template>
  <Sheet v-model:open="isOpen">
    <SheetTrigger as-child>
      <Button variant="ghost" size="icon" class="h-9 w-9">
        <Settings class="h-4 w-4" />
        <span class="sr-only">API Settings</span>
      </Button>
    </SheetTrigger>
    <SheetContent side="right" class="w-[400px] sm:w-[540px] p-4">
      <SheetHeader>
        <SheetTitle>API Settings</SheetTitle>
        <SheetDescription>
          Configure your API endpoint and access token. Settings are saved locally.
        </SheetDescription>
      </SheetHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6 mt-6">
        <div class="space-y-2">
          <Label for="endpoint">API Endpoint</Label>
          <Input
            id="endpoint"
            name="endpoint"
            type="url"
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

        <!-- History Section -->
        <div v-if="settingsHistory.length > 0" class="space-y-3">
          <Label class="text-sm font-medium">Recent Settings</Label>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div
              v-for="(setting, index) in settingsHistory"
              :key="index"
              class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              @click="applyHistorySetting(setting)"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ setting.endpoint }}</p>
                <p class="text-xs text-muted-foreground">
                  Token: {{ setting.accessToken.substring(0, 30) }}...
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ useTimeAgo(setting.savedAt) }}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="ml-2 h-8 w-8 p-0"
                @click.stop="removeHistorySetting(index)"
              >
                <X class="h-4 w-4" />
                <span class="sr-only">Remove</span>
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter class="flex-row gap-2">
          <Button type="submit" :disabled="isLoading" class="flex-1">
            <span v-if="isLoading">Saving...</span>
            <span v-else>Save Settings</span>
          </Button>
          <Button type="button" variant="outline" @click="handleReset" :disabled="isLoading">
            Reset
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Settings, Eye, EyeOff, X } from 'lucide-vue-next'
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
import { useTimeAgo } from '@vueuse/core'

// Types
interface HistorySetting {
  endpoint: string
  accessToken: string
  savedAt: number
}

// Local storage keys
const STORAGE_KEYS = {
  ENDPOINT: 'api_endpoint',
  ACCESS_TOKEN: 'api_access_token',
  HISTORY: 'api_settings_history',
}

// Component state
const isOpen = ref(false)
const isLoading = ref(false)
const showToken = ref(false)
const settingsHistory = ref<HistorySetting[]>([])
const formData = ref({
  endpoint: '',
  accessToken: '',
})

// Load saved settings from localStorage
const loadSettings = () => {
  const savedEndpoint = localStorage.getItem(STORAGE_KEYS.ENDPOINT)
  const savedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

  if (savedEndpoint) {
    formData.value.endpoint = savedEndpoint
  }
  if (savedToken) {
    formData.value.accessToken = savedToken
  }
}

// Load history from localStorage
const loadHistory = () => {
  const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY)
  if (savedHistory) {
    try {
      settingsHistory.value = JSON.parse(savedHistory)
    } catch (error) {
      console.error('Failed to parse settings history:', error)
      settingsHistory.value = []
    }
  }
}

// Save current settings to history (max 5 items)
const saveToHistory = (endpoint: string, accessToken: string) => {
  const newSetting: HistorySetting = {
    endpoint,
    accessToken,
    savedAt: Date.now(),
  }

  // Remove duplicate if exists (same endpoint and token)
  const existingIndex = settingsHistory.value.findIndex(
    (setting) => setting.endpoint === endpoint && setting.accessToken === accessToken,
  )
  if (existingIndex !== -1) {
    settingsHistory.value.splice(existingIndex, 1)
  }

  // Add to beginning of array
  settingsHistory.value.unshift(newSetting)

  // Keep only last 5 items
  if (settingsHistory.value.length > 5) {
    settingsHistory.value = settingsHistory.value.slice(0, 5)
  }

  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(settingsHistory.value))
}

// Apply history setting to form
const applyHistorySetting = (setting: HistorySetting) => {
  formData.value.endpoint = setting.endpoint
  formData.value.accessToken = setting.accessToken
  showToken.value = false // Hide token for security
}

// Remove setting from history
const removeHistorySetting = (index: number) => {
  settingsHistory.value.splice(index, 1)
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(settingsHistory.value))

  toast.success('History item removed!', {
    description: 'The setting has been removed from history.',
  })
}

// Save settings to localStorage
const saveSettings = () => {
  localStorage.setItem(STORAGE_KEYS.ENDPOINT, formData.value.endpoint)
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, formData.value.accessToken)
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
  localStorage.removeItem(STORAGE_KEYS.ENDPOINT)
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)

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
    saveToHistory(formData.value.endpoint, formData.value.accessToken)

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
  loadHistory()
})
</script>
