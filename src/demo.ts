import { DefaultDataFetcher } from '../interfaces/dataFetcher'
import { DataManager } from '../interfaces/dataManager'
import { DefaultDataTransformer } from '../interfaces/dataTransformer'
import type { GraphData, NodeData } from '../interfaces/types'
import { ForceGraph } from './lib/ForceGraph'

// DOM Elements
const graphContainer = document.getElementById('graph-container') as HTMLElement
const layoutToggle = document.getElementById('layout-toggle') as HTMLButtonElement
const thresholdSlider = document.getElementById('threshold-slider') as HTMLInputElement
const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement
const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement
const loadMoreBtn = document.getElementById('load-more-btn') as HTMLButtonElement
const loadingIndicator = document.getElementById('loading-indicator') as HTMLElement
const nodeSearchInput = document.getElementById('node-search') as HTMLInputElement
const nodeSelect = document.getElementById('node-select') as HTMLSelectElement

// Initial empty graph data
const initialData: GraphData = {
  nodes: [],
  links: [],
}

// Create data management components
const dataFetcher = new DefaultDataFetcher()
const dataTransformer = new DefaultDataTransformer()
const dataManager = new DataManager(dataFetcher, dataTransformer)

// Initialize the graph
const graph = new ForceGraph(graphContainer, initialData, {
  width: graphContainer.clientWidth,
  height: graphContainer.clientHeight,
  // layout: "circlepack",
  labelThreshold: 1.2,
  keepDragPosition: true,
  // nodeSize: (node: NodeData) => node.value ? Math.sqrt(node.value) / 100 + 3 : 3,
  nodeLabel: (node: NodeData) => node.label || (node.id as string),
})

// Set the data manager on the graph
graph.setDataManager(dataManager)

// Function to update loading indicator
const updateLoadingIndicator = () => {
  const loadingState = graph.getLoadingState()
  const dataManagerLoading = dataManager.isFetching()
  const isLoading = dataManagerLoading || loadingState.isCalculating
  const paginationInfo = {
    currentPage: dataManager.getCurrentPage(),
    totalPages: dataManager.getTotalPages(),
    isLastPage: dataManager.getIsLastPage(),
  }

  loadingIndicator.style.display = isLoading ? 'block' : 'none'
  loadingIndicator.textContent = isLoading
    ? dataManagerLoading
      ? 'Fetching data...'
      : 'Calculating graph layout...'
    : ''

  // Update load more button state
  loadMoreBtn.disabled = isLoading || (paginationInfo?.isLastPage ?? false)

  // Update button text to show loading progress
  if (paginationInfo?.isLastPage) {
    loadMoreBtn.textContent = 'All Data Loaded'
  } else if (isLoading) {
    loadMoreBtn.textContent = 'Loading...'
  } else {
    loadMoreBtn.textContent = `Load More Data (${
      paginationInfo?.currentPage || 0
    }/${paginationInfo?.totalPages || 5})`
  }

  // Update node selectbox if search is active
  if (nodeSearchInput.value && nodeSelect.style.display === 'block') {
    populateNodeSelect(nodeSearchInput.value)
  }
}

// Function to populate node selectbox
const populateNodeSelect = (searchTerm: string = '') => {
  const graphData = graph.getData()
  const nodes = graphData.nodes || []

  // Clear existing options
  nodeSelect.innerHTML = ''

  // Filter nodes based on search term
  const filteredNodes = nodes.filter((node) => {
    const nodeLabel = node.label || node.id.toString()
    const nodeId = node.id.toString()
    const platform = node.platform || ''

    return (
      nodeLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nodeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      platform.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Sort nodes by label for better UX
  filteredNodes.sort((a, b) => {
    const labelA = a.label || a.id.toString()
    const labelB = b.label || b.id.toString()
    return labelA.localeCompare(labelB)
  })

  // Add filtered nodes to select
  filteredNodes.forEach((node) => {
    const option = document.createElement('option')
    option.value = node.id.toString()

    const nodeLabel = node.label || node.id.toString()
    const platform = node.platform ? ` (${node.platform})` : ''
    option.textContent = `${nodeLabel}${platform}`

    // Add data attributes for additional info
    option.setAttribute('data-platform', node.platform || '')
    option.setAttribute('data-label', nodeLabel)

    nodeSelect.appendChild(option)
  })

  // Show/hide select based on search results
  if (searchTerm && filteredNodes.length > 0) {
    nodeSelect.style.display = 'block'
  } else if (!searchTerm) {
    nodeSelect.style.display = 'none'
  }
}

// Function to focus on selected node
const focusOnNode = (nodeId: string) => {
  if (nodeId && graph.hasNode(nodeId)) {
    graph.focusPosition({ id: nodeId })

    // Clear search and hide select
    nodeSearchInput.value = ''
    nodeSelect.style.display = 'none'

    // Optional: Show feedback
    const node = graph.getNodeById(nodeId)
    if (node) {
      console.log(`Focused on node: ${node.label || nodeId}`)
    }
  } else {
    console.error('Node not found or invalid ID provided.')
  }
}

// Set up event listeners
layoutToggle.addEventListener('click', () => {
  const currentLayout = layoutToggle.textContent?.includes('force') ? 'force' : 'circlepack'
  graph.setLayout(currentLayout as 'force' | 'circlepack')
  layoutToggle.textContent = `Switch to ${
    currentLayout === 'force' ? 'Circle Pack' : 'force'
  } Layout`
})

thresholdSlider.addEventListener('input', () => {
  const threshold = parseFloat(thresholdSlider.value)
  graph.setLabelThreshold(threshold)
})

refreshBtn.addEventListener('click', () => {
  graph.refresh()
})

resetBtn.addEventListener('click', () => {
  graph.resetGraph()
})

loadMoreBtn.addEventListener('click', async () => {
  loadMoreBtn.disabled = true
  try {
    const newData = await dataManager.fetchNextPage()
    if (newData) {
      graph.addData(newData)
    }
  } catch (error) {
    console.error('Error fetching data:', error)
  }
  updateLoadingIndicator()
})

// Node search and selection event listeners
nodeSearchInput.addEventListener('input', (e) => {
  const searchTerm = (e.target as HTMLInputElement).value
  populateNodeSelect(searchTerm)
})

nodeSearchInput.addEventListener('focus', () => {
  if (nodeSearchInput.value) {
    populateNodeSelect(nodeSearchInput.value)
  }
})

nodeSearchInput.addEventListener('blur', (e) => {
  // Only hide if not clicking on the select element
  const relatedTarget = e.relatedTarget as HTMLElement
  if (relatedTarget !== nodeSelect && !nodeSelect.contains(relatedTarget)) {
    // Delay hiding to allow for option selection
    setTimeout(() => {
      nodeSelect.style.display = 'none'
    }, 200)
  }
})

nodeSearchInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' && nodeSelect.style.display === 'block') {
    e.preventDefault()
    nodeSelect.focus()
    if (nodeSelect.options.length > 0) {
      nodeSelect.selectedIndex = 0
    }
  } else if (e.key === 'Enter' && nodeSelect.style.display === 'block') {
    e.preventDefault()
    if (nodeSelect.options.length > 0) {
      const firstOption = nodeSelect.options[0]
      focusOnNode(firstOption.value)
    }
  }
})

// Use mousedown instead of change for immediate response
nodeSelect.addEventListener('mousedown', (e) => {
  const target = e.target as HTMLOptionElement
  if (target.tagName === 'OPTION') {
    e.preventDefault()
    const selectedNodeId = target.value
    if (selectedNodeId) {
      focusOnNode(selectedNodeId)
    }
  }
})

// Keep change event as backup for keyboard navigation
nodeSelect.addEventListener('change', (e) => {
  const selectedNodeId = (e.target as HTMLSelectElement).value
  if (selectedNodeId) {
    focusOnNode(selectedNodeId)
  }
})

nodeSelect.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    const selectedOption = nodeSelect.options[nodeSelect.selectedIndex]
    if (selectedOption) {
      focusOnNode(selectedOption.value)
    }
  } else if (e.key === 'Escape') {
    nodeSearchInput.focus()
    nodeSelect.style.display = 'none'
  }
})

// Click outside to close
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  if (!nodeSearchInput.contains(target) && !nodeSelect.contains(target)) {
    nodeSelect.style.display = 'none'
  }
})

// Set up interval to check loading status
setInterval(updateLoadingIndicator, 100)

// Set initial button text
const currentLayout = layoutToggle.textContent?.includes('force') ? 'force' : 'circlepack'
layoutToggle.textContent = `Switch to ${currentLayout} Layout`

// Load the first page of data automatically
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const initialData = await dataManager.fetchNextPage()
    if (initialData) {
      graph.addData(initialData)
    }
    console.log(graph.getData())
  } catch (error) {
    console.error('Error loading initial data:', error)
  }

  updateLoadingIndicator()
})

// Expose graph to window for debugging
;(window as any).graph = graph
