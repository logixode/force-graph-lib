<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { Moon, Sun } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

// Use VueUse's useDark and useToggle utilities
const isDark = useDark()

// Create a toggle function
const toggleDark = useToggle(isDark)
</script>

<template>
  <Button
    variant="ghost"
    size="sm"
    @click="toggleDark()"
    class="flex items-center justify-center w-9 h-9 p-0"
    aria-label="Toggle theme"
  >
    <Sun v-if="!isDark" class="h-4 w-4" />
    <Moon v-else class="h-4 w-4" />
  </Button>
</template>
