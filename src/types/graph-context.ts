import type { Ref } from 'vue'
import type { ForceGraph } from '../lib/ForceGraph'
import type { DataManager } from '../../interfaces/dataManager'

export interface GraphContext {
  graph: Ref<ForceGraph | undefined>
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
