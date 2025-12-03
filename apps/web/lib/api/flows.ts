/**
 * Flows API Client
 * API calls for workflow management and execution
 * Synced with backend: apps/backend/src/flows/flows.controller.ts
 */

import { fetchAPI } from '../api'
import type {
  Flow,
  CreateFlowDto,
  UpdateFlowDto,
  CreateFlowFromTemplateDto,
  ExecuteFlowDto,
  ExecuteFlowResponse,
  FlowExecution,
} from '../types/flow'

// ============================================================================
// Flow Management
// ============================================================================

/**
 * Get all flows for current user
 */
export async function getFlows(): Promise<Flow[]> {
  return fetchAPI('/flows')
}

/**
 * Get flow by ID
 */
export async function getFlow(id: string): Promise<Flow> {
  return fetchAPI(`/flows/${id}`)
}

/**
 * Create new flow
 */
export async function createFlow(data: CreateFlowDto): Promise<Flow> {
  return fetchAPI('/flows', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Create flow from template
 */
export async function createFlowFromTemplate(data: CreateFlowFromTemplateDto): Promise<Flow> {
  return fetchAPI('/flows/from-template', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Update flow
 */
export async function updateFlow(id: string, data: UpdateFlowDto): Promise<Flow> {
  return fetchAPI(`/flows/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * Delete flow
 */
export async function deleteFlow(id: string): Promise<void> {
  return fetchAPI(`/flows/${id}`, {
    method: 'DELETE',
  })
}

// ============================================================================
// Flow Execution
// ============================================================================

/**
 * Execute flow
 */
export async function executeFlow(
  id: string,
  data?: ExecuteFlowDto
): Promise<ExecuteFlowResponse> {
  return fetchAPI(`/flows/${id}/execute`, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Get all executions for a flow
 */
export async function getFlowExecutions(flowId: string): Promise<FlowExecution[]> {
  return fetchAPI(`/flows/${flowId}/executions`)
}

/**
 * Get execution details
 */
export async function getFlowExecution(executionId: string): Promise<FlowExecution> {
  return fetchAPI(`/flows/executions/${executionId}`)
}

// ============================================================================
// Legacy Support (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use getFlows() instead
 */
export async function fetchFlows(): Promise<Flow[]> {
  return getFlows()
}

/**
 * @deprecated Use getFlow() instead
 */
export async function fetchFlow(id: string): Promise<Flow> {
  return getFlow(id)
}
