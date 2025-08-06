<template>
  <div class="p-4 space-y-4">
    <h2 class="text-2xl font-bold">Vue Query Graph Data Example</h2>

    <!-- Loading States -->
    <div class="flex gap-4">
      <div
        class="px-3 py-1 rounded"
        :class="isLoading ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'"
      >
        Initial Loading: {{ isLoading }}
      </div>
      <div
        class="px-3 py-1 rounded"
        :class="isFetching ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'"
      >
        Fetching: {{ isFetching }}
      </div>
      <div
        class="px-3 py-1 rounded"
        :class="isSuccess ? 'bg-green-100 text-green-800' : 'bg-gray-100'"
      >
        Success: {{ isSuccess }}
      </div>
      <div class="px-3 py-1 rounded" :class="isError ? 'bg-red-100 text-red-800' : 'bg-gray-100'">
        Error: {{ isError }}
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded">
      <h3 class="font-semibold text-red-800">Error:</h3>
      <p class="text-red-600">{{ error.message }}</p>
    </div>

    <!-- Pagination Controls -->
    <div class="flex gap-2 items-center">
      <button
        @click="prevPage"
        :disabled="page <= 1 || isFetching"
        class="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
      >
        Previous
      </button>

      <span class="px-4 py-2 bg-gray-100 rounded">
        Page {{ page }} {{ data?.pagination ? `of ${data?.pagination.pageLast}` : '' }}
      </span>

      <button
        @click="() => page++"
        :disabled="!data?.pagination || page >= data?.pagination.pageLast || isFetching"
        class="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
      >
        Next
      </button>

      <button
        @click="refetch()"
        :disabled="isFetching"
        class="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
      >
        Refresh
      </button>
    </div>

    <!-- Data Display -->
    <div v-if="data" class="space-y-2">
      <h3 class="text-lg font-semibold">Graph Data:</h3>
      <div class="grid grid-cols-2 gap-4">
        <div class="p-3 bg-blue-50 rounded">
          <h4 class="font-medium">Nodes</h4>
          <p class="text-2xl font-bold">{{ data.data.nodes.length }}</p>
        </div>
        <div class="p-3 bg-green-50 rounded">
          <h4 class="font-medium">Links</h4>
          <p class="text-2xl font-bold">{{ data.data.links.length }}</p>
        </div>
      </div>
    </div>

    <!-- Pagination Info -->
    <div v-if="data?.pagination" class="p-3 bg-gray-50 rounded">
      <h4 class="font-medium mb-2">Pagination Info:</h4>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>Current Page: {{ data.pagination.pageCurrent }}</div>
        <div>Last Page: {{ data.pagination.pageLast }}</div>
        <div>Per Page: {{ data.pagination.perPage }}</div>
        <div>Total Data: {{ data.pagination.dataTotal }}</div>
      </div>
    </div>

    <!-- Raw Data (for debugging) -->
    <details class="mt-4">
      <summary class="cursor-pointer font-medium">Raw Data (Debug)</summary>
      <pre class="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">{{
        JSON.stringify({ data, pagination: data?.pagination, error }, null, 2)
      }}</pre>
    </details>
  </div>
</template>

<script setup lang="ts">
import { useFetchGraph } from '@/composeables/useFetchGraph'

// Use the Vue Query-based composable
const { data, page, error, isLoading, isFetching, isError, isSuccess, setPage, prevPage, refetch } =
  useFetchGraph()
</script>
