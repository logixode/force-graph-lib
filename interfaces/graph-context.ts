import type { Ref } from 'vue'
import type { ForceGraph } from '@/lib/ForceGraph'
import type { DataManager } from './dataManager'
import type { Pagination } from './graphResponse'

export interface GraphContext {
  graph: Ref<ForceGraph | undefined>
  pagination: Ref<Pagination | null>
  dataManager: Ref<DataManager | undefined>
  labelThreshold: Ref<number[]>
  loadMoreBtn: Ref<{
    status: boolean
    text: string
  }>
  nodeSelect: Ref<{
    options: {
      label: string
      value: string
    }[]
    selected: unknown
  }>
  fetchLoading: Ref<boolean>
  renderLoading: Ref<boolean>
  updateLoadingIndicator: () => void
}
