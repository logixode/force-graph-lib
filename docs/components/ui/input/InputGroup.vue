<template>
  <div class="input-group flex items-center w-full relative">
    <div
      class="absolute inset-y-0 flex items-center justify-items-center px-2"
      v-if="!!slots['left']"
    >
      <slot name="left" />
    </div>
    <div class="flex-1 min-w-0">
      <slot />
    </div>

    <div
      class="absolute end-0 inset-y-0 flex items-center justify-items-center px-2"
      v-if="!!slots['right']"
    >
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

const slots = useSlots()
</script>
