/**
 * Flow Normalizer Utility
 * Ensures consistent flow structure across the app
 * Handles both new (nodes/edges at top level) and legacy (data.nodes/edges) formats
 */

export interface NormalizedFlow {
  id: string
  name: string
  description?: string
  status: string
  version?: number
  nodes: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    data: Record<string, any>
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    sourceHandle?: string
    targetHandle?: string
  }>
  tags?: string[]
  published?: boolean
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

/**
 * Normalize flow object to ensure nodes and edges are at top level
 * Handles backward compatibility with legacy data.nodes/edges format
 */
export function normalizeFlow(flow: any): NormalizedFlow {
  if (!flow) {
    throw new Error('Flow object is required')
  }

  let nodes: any[] = []
  let edges: any[] = []

  // Priority order:
  // 1. Top-level nodes/edges (new format)
  // 2. data.nodes/edges (legacy format)
  // 3. flow_data.nodes/edges (very old format)

  if (Array.isArray(flow.nodes)) {
    nodes = flow.nodes
  } else if (flow.data?.nodes && Array.isArray(flow.data.nodes)) {
    nodes = flow.data.nodes
  } else if (flow.flow_data?.nodes && Array.isArray(flow.flow_data.nodes)) {
    nodes = flow.flow_data.nodes
  }

  if (Array.isArray(flow.edges)) {
    edges = flow.edges
  } else if (flow.data?.edges && Array.isArray(flow.data.edges)) {
    edges = flow.data.edges
  } else if (flow.flow_data?.edges && Array.isArray(flow.flow_data.edges)) {
    edges = flow.flow_data.edges
  }

  return {
    ...flow,
    nodes,
    edges,
  }
}

/**
 * Normalize array of flows
 */
export function normalizeFlows(flows: any[]): NormalizedFlow[] {
  if (!Array.isArray(flows)) {
    return []
  }
  return flows.map(normalizeFlow)
}

/**
 * Get nodes from flow (with fallback to legacy formats)
 */
export function getFlowNodes(flow: any): any[] {
  if (!flow) return []
  
  if (Array.isArray(flow.nodes)) {
    return flow.nodes
  }
  
  if (flow.data?.nodes && Array.isArray(flow.data.nodes)) {
    return flow.data.nodes
  }
  
  if (flow.flow_data?.nodes && Array.isArray(flow.flow_data.nodes)) {
    return flow.flow_data.nodes
  }
  
  return []
}

/**
 * Get edges from flow (with fallback to legacy formats)
 */
export function getFlowEdges(flow: any): any[] {
  if (!flow) return []
  
  if (Array.isArray(flow.edges)) {
    return flow.edges
  }
  
  if (flow.data?.edges && Array.isArray(flow.data.edges)) {
    return flow.data.edges
  }
  
  if (flow.flow_data?.edges && Array.isArray(flow.flow_data.edges)) {
    return flow.flow_data.edges
  }
  
  return []
}

/**
 * Check if flow has any nodes
 */
export function hasFlowNodes(flow: any): boolean {
  return getFlowNodes(flow).length > 0
}

/**
 * Check if flow has any edges
 */
export function hasFlowEdges(flow: any): boolean {
  return getFlowEdges(flow).length > 0
}

/**
 * Validate flow structure
 */
export function isValidFlow(flow: any): boolean {
  return (
    flow &&
    typeof flow === 'object' &&
    typeof flow.id === 'string' &&
    typeof flow.name === 'string'
  )
}

