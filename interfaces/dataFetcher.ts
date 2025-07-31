import type { FullResponse, Pagination } from './graphResponse'
import axios, { type AxiosInstance } from "axios"

/**
 * Interface for data fetching implementations
 * This allows developers to customize how data is fetched (axios, fetch, different endpoints, etc.)
 */
export interface DataFetcher {
  /**
   * Fetch the next page of data
   * @param currentPage - The current page number
   * @returns Promise that resolves to the raw response data or null if no more data
   */
  fetchNextPage(currentPage: number): Promise<FullResponse<Pagination> | null>

  /**
   * Check if there are more pages to fetch
   * @param currentPage - The current page number
   * @param totalPages - The total number of pages (if known)
   * @returns boolean indicating if more pages are available
   */
  hasMorePages(currentPage: number, totalPages?: number): boolean

  /**
   * Get the current fetching state
   * @returns boolean indicating if currently fetching
   */
  isFetching(): boolean
}

/**
 * Default implementation using fetch API
 * Developers can extend this or create their own implementation
 */
export class DefaultDataFetcher implements DataFetcher {
  private _isFetching: boolean = false
  private baseUrl: string

  constructor(baseUrl: string = '/fetch') {
    this.baseUrl = baseUrl
  }

  async fetchNextPage(currentPage: number): Promise<FullResponse<Pagination> | null> {
    if (this._isFetching) {
      return null
    }

    this._isFetching = true
    const nextPage = currentPage + 1

    try {
      const response = await fetch(`${this.baseUrl}/page${nextPage}.json`)
      if (!response.ok) {
        throw new Error(`Failed to fetch page ${nextPage}: ${response.statusText}`)
      }

      const rawData: FullResponse<Pagination> = await response.json()
      return rawData
    } catch (error) {
      console.error('Error fetching next page:', error)
      return null
    } finally {
      this._isFetching = false
    }
  }

  hasMorePages(currentPage: number, totalPages?: number): boolean {
    if (totalPages !== undefined) {
      return currentPage < totalPages
    }
    // If totalPages is unknown, assume there might be more pages
    // This will be determined by the actual fetch result
    return true
  }

  isFetching(): boolean {
    return this._isFetching
  }
}

/**
 * Example implementation using axios (developers would need to install axios)
 * This shows how to customize the fetcher for different HTTP libraries
 */
export class AxiosDataFetcher implements DataFetcher {
  private _isFetching: boolean = false
  private baseUrl: string
  private headers: Record<string, string>
  private axios: AxiosInstance // Would be imported from 'axios'

  constructor(
    baseUrl: string,
    headers: Record<string, string> = {},
    axiosInstance?: AxiosInstance,
  ) {
    this.baseUrl = baseUrl
    this.headers = headers
    this.axios = axiosInstance || axios.create()
  }

  async fetchNextPage(currentPage: number): Promise<FullResponse<Pagination> | null> {
    if (this._isFetching || !this.axios) {
      return null
    }

    this._isFetching = true
    const nextPage = currentPage + 1

    try {
      const response = await this.axios.get(`${this.baseUrl}/page${nextPage}.json`, {
        headers: this.headers,
      })

      return response.data
    } catch (error) {
      console.error('Error fetching next page:', error)
      return null
    } finally {
      this._isFetching = false
    }
  }

  hasMorePages(currentPage: number, totalPages?: number): boolean {
    if (totalPages !== undefined) {
      return currentPage < totalPages
    }
    return true
  }

  isFetching(): boolean {
    return this._isFetching
  }
}

/**
 * Example implementation for custom API endpoints with authentication
 */
export class CustomApiDataFetcher implements DataFetcher {
  private _isFetching: boolean = false
  private apiEndpoint: string
  private authToken?: string
  private customParams: Record<string, unknown>

  constructor(apiEndpoint: string, authToken?: string, customParams: Record<string, unknown> = {}) {
    this.apiEndpoint = apiEndpoint
    this.authToken = authToken
    this.customParams = customParams
  }

  async fetchNextPage(currentPage: number): Promise<FullResponse<Pagination> | null> {
    if (this._isFetching) {
      return null
    }

    this._isFetching = true
    const nextPage = currentPage + 1

    try {
      const url = new URL(this.apiEndpoint)
      url.searchParams.append('page', nextPage.toString())

      // Add custom parameters
      Object.entries(this.customParams).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch page ${nextPage}: ${response.statusText}`)
      }

      const rawData: FullResponse<Pagination> = await response.json()
      return rawData
    } catch (error) {
      console.error('Error fetching next page:', error)
      return null
    } finally {
      this._isFetching = false
    }
  }

  hasMorePages(currentPage: number, totalPages?: number): boolean {
    if (totalPages !== undefined) {
      return currentPage < totalPages
    }
    return true
  }

  isFetching(): boolean {
    return this._isFetching
  }

  setAuthToken(token: string) {
    this.authToken = token
  }

  updateParams(params: Record<string, unknown>) {
    this.customParams = { ...this.customParams, ...params }
  }
}
