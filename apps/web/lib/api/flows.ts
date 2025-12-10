import axiosClient from '@/lib/axios-client';

export interface Flow {
    id: string;
    name: string;
    description?: string;
    status: 'draft' | 'published' | 'archived';
    version?: number;
    visibility?: 'private' | 'team' | 'public';
    nodes: Array<{
        id: string;
        type: string;
        position: { x: number; y: number };
        data?: Record<string, any>;
        properties?: NodeProperty[]; // Enriched by backend - NodeType properties for form generation
        nodeTypeInfo?: {
            id: string;
            label: string;
            category: string;
            icon: string;
            color: string;
            description?: string;
        };
    }>;
    edges: Array<{
        id: string;
        source: string;
        target: string;
        sourceHandle?: string;
        targetHandle?: string;
    }>;

    // Backward compatibility
    data?: {
        nodes: any[];
        edges: any[];
    };
    templateId?: string;
    tags?: string[];
    icon?: string;
    category?: string;
    createdAt: string;
    updatedAt: string;
}

export interface NodeProperty {
    name: string;
    label: string;
    type: 'string' | 'text' | 'number' | 'boolean' | 'select' | 'multi-select' | 'json' | 'file' | 'files' | 'key-value' | 'dynamic-form';
    required?: boolean;
    default?: any;
    placeholder?: string;
    description?: string;
    options?: Array<{ value: string; label: string } | string>;
    showWhen?: Record<string, any>;
    min?: number;
    max?: number;
    pattern?: string;
    maxLength?: number;
    rows?: number;
    helpText?: string;
    accept?: string;
    multiple?: boolean;
    properties?: NodeProperty[];
}

export interface FlowExecution {
    id: string;
    flowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    input?: any;
    output?: any;
    error?: string;
    startedAt: string;
    completedAt?: string;
}

export interface CreateFlowFromTemplateDto {
    templateId: string;
    name: string;
    description?: string;
}

export const flowsApi = {
    /**
     * Get all flows
     */
    async getAll(params?: { published?: boolean }): Promise<Flow[]> {
        return await axiosClient.get('/flows', { params });
    },

    /**
     * Get flow by ID
     */
    async getOne(id: string): Promise<Flow> {
        return await axiosClient.get(`/flows/${id}`);
    },

    /**
     * Execute flow
     */
    async execute(id: string, input?: any): Promise<{ executionId: string; flowId: string; status: string; startedAt: string }> {
        return await axiosClient.post(`/flows/${id}/execute`, input);
    },

    /**
     * Get execution status
     */
    async getExecution(executionId: string): Promise<FlowExecution> {
        return await axiosClient.get(`/flows/executions/${executionId}`);
    },

    /**
     * Get flow executions
     */
    async getExecutions(flowId: string): Promise<FlowExecution[]> {
        return await axiosClient.get(`/flows/${flowId}/executions`);
    },

    /**
     * Update flow
     */
    async update(id: string, data: Partial<Flow>): Promise<Flow> {
        return await axiosClient.patch(`/flows/${id}`, data);
    },

    /**
     * Delete flow
     */
    async delete(id: string): Promise<void> {
        await axiosClient.delete(`/flows/${id}`);
    },
};

