import { type DataFetcher, DefaultDataFetcher } from './dataFetcher'
import { type DataTransformer, DefaultDataTransformer } from './dataTransformer'
import type { GraphData } from './types'

/**
 * DataManager handles data fetching and transformation for the ForceGraph
 * This separates all data-related logic from the graph rendering logic
 */
export class DataManager {
  private fetcher: DataFetcher
  private transformer: DataTransformer
  private currentPage: number = 0
  private totalPages?: number
  private isLastPage: boolean = false

  constructor(fetcher?: DataFetcher, transformer?: DataTransformer) {
    this.fetcher = fetcher || new DefaultDataFetcher()
    this.transformer = transformer || new DefaultDataTransformer()
  }

  /**
   * Fetch and transform the next page of data
   * @returns Promise<GraphData | null> - Returns transformed data or null if no more data
   */
  async fetchNextPage(): Promise<GraphData | null> {
    if (this.isLastPage || this.fetcher.isFetching()) {
      return null
    }

    if (!this.fetcher.hasMorePages(this.currentPage, this.totalPages)) {
      this.isLastPage = true
      return null
    }

    console.time('calculate time fetchNextPage')
    const rawData = await this.fetcher.fetchNextPage(this.currentPage)
    console.timeEnd('calculate time fetchNextPage')

    if (!rawData) {
      return null
    }

    // Update pagination info
    this.currentPage = rawData.data.pagination.pageCurrent || this.currentPage + 1
    this.totalPages = rawData.data.pagination.pageLast
    this.isLastPage =
      this.currentPage >= (this.totalPages || 0) ||
      rawData.data.pagination.pageLast === rawData.data.pagination.pageCurrent

    // Transform the data
    console.time('calculate time transformData')
    const transformedData = this.transformer.transformData(rawData)
    console.timeEnd('calculate time transformData')

    return transformedData
  }

  /**
   * Check if currently fetching data
   */
  isFetching(): boolean {
    return this.fetcher.isFetching()
  }

  /**
   * Check if this is the last page
   */
  getIsLastPage(): boolean {
    return this.isLastPage
  }

  /**
   * Get current page number
   */
  getCurrentPage(): number {
    return this.currentPage
  }

  /**
   * Get total pages (if known)
   */
  getTotalPages(): number | undefined {
    return this.totalPages
  }

  /**
   * Reset pagination state and data
   */
  reset(): void {
    this.currentPage = 0
    this.totalPages = undefined
    this.isLastPage = false
  }

  /**
   * Load more data from the data source
   * @returns Promise<GraphData | null> - Returns transformed data or null if no more data
   */
  async loadMoreData(): Promise<GraphData | null> {
    return this.fetchNextPage()
  }

  /**
   * Update the data fetcher
   */
  setFetcher(fetcher: DataFetcher): void {
    this.fetcher = fetcher
  }

  /**
   * Update the data transformer
   */
  setTransformer(transformer: DataTransformer): void {
    this.transformer = transformer
  }
}
