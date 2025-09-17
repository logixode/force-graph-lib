import { useQuery } from '@tanstack/vue-query'
import axios from 'axios'
import { DefaultDataTransformer } from '../../interfaces/dataTransformer'
import type { FullResponse, Pagination } from 'interfaces/graphResponse'
import type { GraphData } from 'interfaces/types'
import { computed, ref, toValue, watch } from 'vue'
import type { RemovableRef } from '@vueuse/core'
import type { HistorySetting } from '@docs/components/RecentSetting.vue'

const transformer = new DefaultDataTransformer()

export function useFetchGraph(apiSetting: RemovableRef<HistorySetting>) {
  const page = ref(1)
  const queryKey = computed(() => ['graphData', apiSetting.value.params, page.value])
  const { endpoint, accessToken, params } = toValue(apiSetting)

  // Use TanStack Query
  const { data, error, isLoading, isFetching, isError, refetch, isSuccess, promise } = useQuery({
    queryKey,
    queryFn: () => fetchGraphData(endpoint, accessToken, params, page.value),
    enabled: computed(() => !!endpoint && !!accessToken),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    experimental_prefetchInRender: true,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  watch(data, (val) => {
    console.log('watching data change', val)
  })

  // Helper function to wait for current query to complete
  const waitForQueryCompletion = async (): Promise<void> => {
    await promise.value
    return new Promise((resolve) => {
      if (!isFetching.value) {
        resolve()
        return
      }

      const unwatch = watch(isFetching, (fetching) => {
        if (!fetching) {
          unwatch()
          resolve()
        }
      })
    })
  }

  // Helper function to load next page and wait for completion
  const loadNextPage = async (): Promise<typeof data.value> => {
    page.value++
    await waitForQueryCompletion()
    return data.value
  }

  // Helper functions
  const setPage = (newPage: number) => {
    page.value = newPage
  }

  const prevPage = () => {
    if (page.value > 1) {
      page.value--
    }
  }
  const reset = () => {
    if (page.value == 1) refetch()
    page.value = 1
  }

  return {
    data,
    endpoint,
    accessToken,
    // pagination,
    error,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    promise,
    refetch,
    setPage,
    // nextPage,
    prevPage,
    waitForQueryCompletion,
    loadNextPage,
    reset,
  }
}

// Query function to fetch data
async function fetchGraphData(
  endpoint: string,
  accessToken: string,
  params: Record<string, any> = {},
  page: number
): Promise<{ data: GraphData; pagination: Pagination }> {
  if (!endpoint) {
    throw new Error('API endpoint not configured. Please set it in API Settings.')
  }

  if (!accessToken) {
    throw new Error('Access token not configured. Please set it in API Settings.')
  }

  try {
    const response = await axios.get<FullResponse<Pagination>>(endpoint, {
      params: {
        ...Object.fromEntries(
          Object.entries(params).map(([key, value]) => [
            key,
            typeof value == 'string' ? value : JSON.stringify(value),
          ])
        ),
        page,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response format from API')
    }

    const fullResponse = response.data

    // Transform the data using the transformer
    const transformedData = transformer.transformData(fullResponse)
    console.log('onfetch', transformedData)

    return {
      data: transformedData,
      pagination: fullResponse.data.pagination,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your access token.')
      } else if (error.response?.status === 404) {
        throw new Error('API endpoint not found. Please check your endpoint URL.')
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.')
      } else if (!error.response) {
        throw new Error('Network error. Please check your internet connection.')
      }
    }
    throw error
  }
}
