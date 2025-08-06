import { useQuery } from '@tanstack/vue-query'
import axios from 'axios'
import { DefaultDataTransformer } from '../../interfaces/dataTransformer'
import type { FullResponse, Pagination } from 'interfaces/graphResponse'
import type { GraphData } from 'interfaces/types'
import { ref, computed, toValue, watchEffect, watch } from 'vue'

// Storage keys for API settings
export const API_KEYS = {
  ENDPOINT: 'api_endpoint',
  ACCESS_TOKEN: 'api_access_token',
}
// Get stored endpoint and token from localStorage
const endpoint = localStorage.getItem(API_KEYS.ENDPOINT)
const accessToken = localStorage.getItem(API_KEYS.ACCESS_TOKEN)

const transformer = new DefaultDataTransformer()

export function useFetchGraph() {
  const page = ref<number>(1)

  // Use TanStack Query
  const { data, error, isLoading, isFetching, isError, refetch, isSuccess, promise } = useQuery({
    queryKey: ['graphData', page],
    queryFn: () => fetchGraphData(toValue(page)),
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
    page,
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
  pageNum: number,
): Promise<{ data: GraphData; pagination: Pagination }> {
  if (!endpoint) {
    throw new Error('API endpoint not configured. Please set it in API Settings.')
  }

  if (!accessToken) {
    throw new Error('Access token not configured. Please set it in API Settings.')
  }

  const url = new URL(endpoint)
  url.search = new URLSearchParams({
    page: pageNum.toString(),
    size: '4',
    sentiment_selected: 'linguistik',
    dateStart: '2025-07-05',
    dateStop: '2025-08-05',
    platforms: JSON.stringify(['facebook', 'instagram', 'tiktok', 'twitter', 'youtube']),
    sentiment: JSON.stringify([-1, 0, 1]),
    prokontra: JSON.stringify([-1, 0, 1]),
    keywords: JSON.stringify([
      'Manchester United',
      'Bournemouth',
      '2025',
      'Arsenal',
      'Bruno Fernandes',
      'Diogo Jota',
      'Tottenham',
      '2024/25',
      '2024/25 season',
      '3 Juli',
      '4-1',
      '69th minute',
      'All Goals',
      'Amorim',
      'Andre',
    ]),
  }).toString()

  try {
    const response = await axios.get<FullResponse<Pagination>>(url.toString(), {
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
