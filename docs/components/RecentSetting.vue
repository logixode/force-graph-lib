<template>
  <Collapsible v-model:open="open" class="space-y-2 -mx-2">
    <CollapsibleTrigger as-child>
      <Button variant="ghost" size="sm" class="w-full justify-between">
        Recent Settings ({{ settingsHistory.length }})

        <ChevronsUpDown class="h-4 w-4" />
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent class="space-y-2 max-h-96 overflow-y-auto">
      <div
        v-for="(setting, index) in settingsHistory"
        :key="index"
        class="flex justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
        @click="applyHistorySetting(setting.snapshot!)"
      >
        <div class="flex-1 min-w-0">
          <p class="text-xs text-muted-foreground">
            {{ useTimeAgo(setting.timestamp) }}
          </p>
          <p class="text-sm text-muted-foreground font-medium truncate">
            Endpoint: {{ setting.snapshot!.endpoint }}
          </p>
          <p class="text-xs text-muted-foreground">
            Token: {{ setting.snapshot!.accessToken.substring(0, 30) }}...
          </p>
          <div class="text-xs text-muted-foreground">
            <p>Params:</p>
            <ul class="list-disc pl-5">
              <li
                v-for="[key, value] in Object.entries(setting.snapshot.params).map(([key, val]) => [
                  key,
                  String(val),
                ])"
                :key="key"
              >
                <b>{{ key }}:</b> {{ value }}
              </li>
            </ul>
          </div>
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
    </CollapsibleContent>
  </Collapsible>
</template>

<script lang="ts">
// Types
export interface HistorySetting {
  endpoint: string
  accessToken: string
  params: Record<string, any>
}
</script>
<script setup lang="ts">
import { useTimeAgo, type UseRefHistoryRecord } from '@vueuse/core'
import { Button } from './ui/button'
import { ChevronsUpDown, X } from 'lucide-vue-next'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { type GraphContext } from '@docs/context/graphContext'

const props = defineProps<{
  HISTORY_KEY: string
}>()
const settingsHistory = defineModel<UseRefHistoryRecord<HistorySetting>[]>('settingsHistory', {
  required: true,
})
const formData = defineModel<GraphContext['apiSetting']['value']>('formData', {
  required: true,
})

const open = ref(false)
const showToken = ref(false)

// Load history from localStorage
// watchEffect(() => {
// })

// Apply history setting to form
const applyHistorySetting = (setting: HistorySetting) => {
  formData.value.endpoint = setting.endpoint
  formData.value.accessToken = setting.accessToken
  formData.value.params = setting.params
  showToken.value = false // Hide token for security
}

// Remove setting from history
const removeHistorySetting = (index: number) => {
  settingsHistory.value.splice(index, 1)
  localStorage.setItem(props.HISTORY_KEY, JSON.stringify(settingsHistory.value))

  toast.success('History item removed!', {
    description: 'The setting has been removed from history.',
  })
}
</script>

<style scoped></style>
