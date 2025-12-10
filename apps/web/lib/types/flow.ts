
export interface Flow {
  id: string
  name: string
  description?: string
  status: 'draft' | 'published' | 'archived'
  version: number
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  templateId?: string
  channelId?: string
  visibility?: 'private' | 'public'
  category?: string
  ownerId?: string
  userId?: string
  teamId?: string
  published: boolean
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateFlowDto {
  name: string
  description?: string
  status?: 'draft' | 'published'
  version?: number
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
  templateId?: string
  channelId?: string
  visibility?: 'private' | 'public'
  category?: string
  published?: boolean
  tags?: string[]
}

export interface UpdateFlowDto {
  name?: string
  description?: string
  status?: 'draft' | 'published' | 'archived'
  version?: number
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
  templateId?: string
  channelId?: string
  visibility?: 'private' | 'public'
  published?: boolean
  tags?: string[]
}

export interface CreateFlowFromTemplateDto {
  templateId: string
  name: string
  description?: string
}

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

export interface WorkflowNode {
  id: string
  type: string // For ReactFlow: 'custom', For Backend: NodeType.id
  position: { x: number; y: number }
  data: Record<string, any> | {
    type?: string // NodeType.id
    label?: string
    nodeType?: string // NodeType.id (alternative field)
    config?: Record<string, any>
    color?: string
    description?: string
  }
  properties?: Array<{
    name: string
    type: string
    label?: string
    required?: boolean
    default?: any
    defaultValue?: any
    placeholder?: string
    description?: string
    options?: Array<{ value: string; label: string }>
    accept?: string
    multiple?: boolean
    min?: number
    max?: number
    showWhen?: Record<string, any>
  }>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type?: string
}

export interface ExecutionStatus {
  id: string
  status: 'pending' | 'running' | 'success' | 'failed'
  startedAt?: string
  completedAt?: string
  error?: string
}

