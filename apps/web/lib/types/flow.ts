/**
 * Flow/Workflow related type definitions
 * Synced with backend: apps/backend/src/flows/
 */

// ============================================================================
// Flow Entity
// ============================================================================

export interface Flow {
  id: string
  name: string
  description?: string
  status: 'draft' | 'published' | 'archived'
  templateId?: string
  data: Record<string, any>
  channelId?: string
  visibility?: 'private' | 'public'
  userId: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Flow DTOs
// ============================================================================

export interface CreateFlowDto {
  name: string
  description?: string
  status?: 'draft' | 'published'
  templateId?: string
  data?: Record<string, any>
  channelId?: string
  visibility?: 'private' | 'public'
}

export interface UpdateFlowDto {
  name?: string
  description?: string
  status?: 'draft' | 'published' | 'archived'
  templateId?: string
  data?: Record<string, any>
  channelId?: string
  visibility?: 'private' | 'public'
}

export interface CreateFlowFromTemplateDto {
  templateId: string
  name: string
  description?: string
}

// ============================================================================
// Flow Responses
// ============================================================================

export interface GetFlowsResponse {
  data: Flow[]
  success: boolean
}

export interface GetFlowResponse {
  data: Flow
  success: boolean
}

export interface CreateFlowResponse {
  data: Flow
  success: boolean
}

export interface UpdateFlowResponse {
  data: Flow
  success: boolean
}

export interface DeleteFlowResponse {
  success: boolean
}

// ============================================================================
// Flow Execution
// ============================================================================

export interface FlowExecution {
  id: string
  flowId: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
  input?: Record<string, any>
  output?: Record<string, any>
  error?: string
  startedAt: string
  completedAt?: string
  duration?: number
}

export interface ExecuteFlowDto {
  input?: Record<string, any>
}

export interface ExecuteFlowResponse {
  executionId: string
  flowId: string
  status: string
  startedAt: string
}

export interface GetExecutionsResponse {
  data: FlowExecution[]
  success: boolean
}

export interface GetExecutionResponse {
  data: FlowExecution
  success: boolean
}

// ============================================================================
// Workflow Nodes (UI)
// ============================================================================

export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    type: string
    label: string
    config?: Record<string, any>
    icon?: string
    color?: string
    description?: string
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type?: string
}

// ============================================================================
// Legacy (for backward compatibility)
// ============================================================================

export interface ExecutionStatus {
  id: string
  status: 'pending' | 'running' | 'success' | 'failed'
  startedAt?: string
  completedAt?: string
  error?: string
}
