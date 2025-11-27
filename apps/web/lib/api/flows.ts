/**
 * Flows API Client
 * Centralized API calls for workflow management
 */
import { fetchAPI } from '../api'

export interface Flow {
  id: number
  name: string
  description: string
  status: 'draft' | 'published' | 'archived'
  is_active: boolean
  flow_data: Record<string, unknown>
  created_at: string
  updated_at: string
  archived_at?: string
  user_id: string
  version?: number
  executions?: number
  successRate?: number
  channel_id?: number | null
}

export interface FlowCreateData {
  name: string
  description?: string
  status?: 'draft' | 'published'
  is_active?: boolean
  flow_data?: Record<string, unknown>
}

export interface FlowUpdateData {
  name?: string
  description?: string
  status?: 'draft' | 'published' | 'archived'
  is_active?: boolean
  flow_data?: Record<string, unknown>
}

/**
 * Fetch all flows
 */
export async function fetchFlows(): Promise<Flow[]> {
  return fetchAPI('/flows/')
}

/**
 * Fetch single flow by ID
 */
export async function fetchFlow(id: number): Promise<Flow> {
  return fetchAPI(`/flows/${id}`)
}

/**
 * Create new flow
 */
export async function createFlow(data: FlowCreateData): Promise<Flow> {
  return fetchAPI('/flows/', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * Update existing flow
 */
export async function updateFlow(id: number, data: FlowUpdateData): Promise<Flow> {
  return fetchAPI(`/flows/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

/**
 * Delete flow
 */
export async function deleteFlow(id: number): Promise<void> {
  return fetchAPI(`/flows/${id}`, { method: 'DELETE' })
}

/**
 * Duplicate flow
 */
export async function duplicateFlow(id: number): Promise<Flow> {
  return fetchAPI(`/flows/${id}/duplicate`, { method: 'POST' })
}

/**
 * Archive flow
 */
export async function archiveFlow(id: number): Promise<Flow> {
  return fetchAPI(`/flows/${id}/archive`, { method: 'POST' })
}
