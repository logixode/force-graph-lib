// Example showing how to use curve functionality in ForceGraph
import { ForceGraph } from '../lib/ForceGraph'
import type { GraphData } from '../../interfaces/types'

// Sample data with curvature properties
const sampleData: GraphData = {
  nodes: [
    { id: 'A', label: 'Node A', color: '#ff6b6b' },
    { id: 'B', label: 'Node B', color: '#4ecdc4' },
    { id: 'C', label: 'Node C', color: '#45b7d1' },
    { id: 'D', label: 'Node D', color: '#96ceb4' },
    { id: 'E', label: 'Node E', color: '#feca57' },
  ],
  links: [
    { source: 'A', target: 'B', curvature: 0.2 },
    { source: 'B', target: 'C', curvature: 0.5 },
    { source: 'C', target: 'D', curvature: -0.3 },
    { source: 'D', target: 'E', curvature: 0.8 },
    { source: 'E', target: 'A', curvature: 0.1 },
  ],
}

// Example 1: Constructor-based configuration (recommended for initial setup)
export const basicCurveExample = (container: HTMLElement) => {
  console.log('🎯 Basic Curve Example')

  const graph = new ForceGraph(container, sampleData, {
    nodeSize: 2,
    nodeColor: '#4ecdc4',
    linkCurvature: 'curvature', // Use the 'curvature' property from link data
    linkDirectionalParticles: 2,
  })

  return graph
}

// Example 2: Mixed approach - constructor + renderer for dynamic updates
export const functionBasedCurveExample = (container: HTMLElement) => {
  console.log('🔧 Function-based Curve Example')

  const graph = new ForceGraph(container, sampleData, {
    nodeSize: 2,
    nodeColor: '#ff6b6b',
    linkCurvature: (link) => link.curvature || Math.random() * 0.5,
  })

  // Use renderer() for dynamic updates
  graph.renderer()
    .linkDirectionalParticles((link: any) => {
      return link.curvature && Math.abs(link.curvature) > 0.3 ? 4 : 1
    })
    .linkDirectionalParticleSpeed(0.02)
    .linkDirectionalParticleColor('#ff6b6b')

  return graph
}

// Example 3: Fixed curvature for all links
export const fixedCurveExample = (container: HTMLElement) => {
  console.log('📐 Fixed Curve Example')

  const graph = new ForceGraph(container, sampleData, {
    nodeSize: 2,
    linkCurvature: 0.3,
    linkDirectionalParticles: 3,
    linkDirectionalParticleSpeed: 0.015,
    linkDirectionalParticleWidth: 6,
    linkDirectionalParticleColor: (link) => {
      // Color particles based on source node
      const sourceNode = sampleData.nodes.find((n) => n.id === link.source)
      return sourceNode?.color || '#333'
    }
  })

  return graph
}

// Example 4: Advanced curve configuration
export const advancedCurveExample = (container: HTMLElement) => {
  console.log('🚀 Advanced Curve Example')

  const graph = new ForceGraph(container, sampleData, {
    // Set curve options via constructor
    linkCurvature: (link) => {
      // Create different curve patterns
      const hash = (link.source?.toString() + link.target?.toString()).length
      return ((hash % 3) - 1) * 0.4 // -0.4, 0, or 0.4
    },
    linkDirectionalParticles: (link) => {
      // Vary particle count based on curvature
      const curvature = Math.abs(link.curvature || 0)
      return Math.floor(curvature * 10) + 1
    },
    linkDirectionalParticleSpeed: 0.01,
    linkDirectionalParticleWidth: (link) => {
      // Wider particles for more curved links
      const curvature = Math.abs(link.curvature || 0)
      return 3 + curvature * 5
    },
    linkDirectionalParticleColor: (link) => {
      // Color based on curvature direction
      const curvature = link.curvature || 0
      if (curvature > 0) return '#ff6b6b' // Red for positive curvature
      if (curvature < 0) return '#4ecdc4' // Teal for negative curvature
      return '#999' // Gray for straight lines
    },
  })

  return graph
}

// Example 5: Dynamic curve updates
export const dynamicCurveExample = (container: HTMLElement) => {
  console.log('⚡ Dynamic Curve Example')

  const graph = new ForceGraph(container, sampleData, {
    nodeSize: 2,
    linkDirectionalParticles: 2,
    linkCurvature: 0
  })

  // Animate curvature over time using renderer() for dynamic updates
  let time = 0
  const animateInterval = setInterval(() => {
    time += 0.1
    graph.renderer().linkCurvature((link: any) => {
      return Math.sin(time + (link.source?.toString().charCodeAt(0) || 0) * 0.1) * 0.5
    })

    // Stop after 10 seconds
    if (time > 10) {
      clearInterval(animateInterval)
    }
  }, 100)

  return graph
}

// Example 6: Conditional curves
export const conditionalCurveExample = (container: HTMLElement) => {
  console.log('🎛️ Conditional Curve Example')

  // Add some additional data to links for demonstration
  const dataWithTypes: GraphData = {
    ...sampleData,
    links: sampleData.links.map((link, index) => ({
      ...link,
      type: index % 2 === 0 ? 'primary' : 'secondary',
      weight: Math.random() * 10,
    })),
  }

  const graph = new ForceGraph(container, dataWithTypes, {
    nodeSize: 2,
    linkDirectionalParticles: (link) => {
      // Only show particles on primary links
      return (link as any).type === 'primary' ? 3 : 0
    },
    linkCurvature: (link) => {
      // Curve only secondary links
      if ((link as any).type === 'secondary') {
        return ((link as any).weight / 10) * 0.6
      }
      return 0
    },
    linkDirectionalParticleColor: (link) => {
      return (link as any).type === 'primary' ? '#ff6b6b' : '#4ecdc4'
    }
  })

  return graph
}

// Export all examples for easy access
export const curveExamples = {
  basic: basicCurveExample,
  functionBased: functionBasedCurveExample,
  fixed: fixedCurveExample,
  advanced: advancedCurveExample,
  dynamic: dynamicCurveExample,
  conditional: conditionalCurveExample,
}

// Helper function to run a specific example
export const runCurveExample = (
  exampleName: keyof typeof curveExamples,
  container: HTMLElement,
) => {
  const example = curveExamples[exampleName]
  if (example) {
    return example(container)
  } else {
    console.error(`Example "${exampleName}" not found`)
    return null
  }
}