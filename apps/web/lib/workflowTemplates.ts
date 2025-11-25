import type { Node, Edge } from 'reactflow'

export interface WorkflowTemplate {
    id: string
    name: string
    description: string
    category: string
    nodes: Node[]
    edges: Edge[]
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
        id: 'customer-support-ai',
        name: 'AI Customer Support',
        description: 'Automated customer support with AI response suggestions',
        category: 'Customer Service',
        nodes: [
            {
                id: 'trigger-1',
                type: 'custom',
                position: { x: 250, y: 50 },
                data: {
                    label: 'New Message',
                    type: 'trigger-message',
                    config: {}
                }
            },
            {
                id: 'ai-1',
                type: 'custom',
                position: { x: 250, y: 200 },
                data: {
                    label: 'AI Suggest Response',
                    type: 'ai-suggest',
                    config: {
                        prompt: 'You are a helpful customer support agent. Based on the customer message: {customer_message}, provide a professional and helpful response.'
                    }
                }
            },
            {
                id: 'send-1',
                type: 'custom',
                position: { x: 250, y: 350 },
                data: {
                    label: 'Send Reply',
                    type: 'send-whatsapp',
                    config: {
                        message: '{ai_response}'
                    }
                }
            }
        ],
        edges: [
            { id: 'e1-2', source: 'trigger-1', target: 'ai-1' },
            { id: 'e2-3', source: 'ai-1', target: 'send-1' }
        ]
    },
    {
        id: 'message-classifier',
        name: 'Message Classifier',
        description: 'Classify incoming messages and route to appropriate team',
        category: 'Automation',
        nodes: [
            {
                id: 'trigger-1',
                type: 'custom',
                position: { x: 250, y: 50 },
                data: {
                    label: 'New Message',
                    type: 'trigger-message',
                    config: {}
                }
            },
            {
                id: 'classify-1',
                type: 'custom',
                position: { x: 250, y: 200 },
                data: {
                    label: 'Classify Message',
                    type: 'ai-classify',
                    config: {
                        categories: ['urgent', 'question', 'complaint', 'feedback', 'other']
                    }
                }
            },
            {
                id: 'condition-1',
                type: 'custom',
                position: { x: 100, y: 350 },
                data: {
                    label: 'Is Urgent?',
                    type: 'logic-condition',
                    config: {
                        operator: 'equals',
                        value: 'urgent'
                    }
                }
            },
            {
                id: 'send-urgent',
                type: 'custom',
                position: { x: 100, y: 500 },
                data: {
                    label: 'Alert Team',
                    type: 'send-slack',
                    config: {
                        message: '🚨 Urgent message from {customer_name}: {customer_message}'
                    }
                }
            },
            {
                id: 'send-normal',
                type: 'custom',
                position: { x: 400, y: 500 },
                data: {
                    label: 'Auto Reply',
                    type: 'send-whatsapp',
                    config: {
                        message: 'Thank you for your message. Our team will respond shortly.'
                    }
                }
            }
        ],
        edges: [
            { id: 'e1-2', source: 'trigger-1', target: 'classify-1' },
            { id: 'e2-3', source: 'classify-1', target: 'condition-1' },
            { id: 'e3-4', source: 'condition-1', target: 'send-urgent', label: 'Yes' },
            { id: 'e3-5', source: 'condition-1', target: 'send-normal', label: 'No' }
        ]
    },
    {
        id: 'openai-chatbot',
        name: 'OpenAI Chatbot',
        description: 'Advanced chatbot powered by GPT-4',
        category: 'AI',
        nodes: [
            {
                id: 'trigger-1',
                type: 'custom',
                position: { x: 250, y: 50 },
                data: {
                    label: 'New Message',
                    type: 'trigger-message',
                    config: {}
                }
            },
            {
                id: 'openai-1',
                type: 'custom',
                position: { x: 250, y: 200 },
                data: {
                    label: 'GPT-4 Response',
                    type: 'ai-openai',
                    config: {
                        prompt: 'You are a friendly and knowledgeable assistant. Customer says: {customer_message}. Provide a helpful response.',
                        model: 'gpt-4',
                        temperature: 0.7,
                        max_tokens: 150
                    }
                }
            },
            {
                id: 'send-1',
                type: 'custom',
                position: { x: 250, y: 350 },
                data: {
                    label: 'Send Response',
                    type: 'send-telegram',
                    config: {
                        message: '{ai_response}'
                    }
                }
            }
        ],
        edges: [
            { id: 'e1-2', source: 'trigger-1', target: 'openai-1' },
            { id: 'e2-3', source: 'openai-1', target: 'send-1' }
        ]
    },
    {
        id: 'webhook-integration',
        name: 'Webhook Integration',
        description: 'Process webhook data and send notifications',
        category: 'Integration',
        nodes: [
            {
                id: 'trigger-1',
                type: 'custom',
                position: { x: 250, y: 50 },
                data: {
                    label: 'Webhook Trigger',
                    type: 'trigger-webhook',
                    config: {}
                }
            },
            {
                id: 'http-1',
                type: 'custom',
                position: { x: 250, y: 200 },
                data: {
                    label: 'API Request',
                    type: 'action-http',
                    config: {
                        url: 'https://api.example.com/data',
                        method: 'POST',
                        headers: '{"Content-Type": "application/json"}',
                        body: '{"data": "{webhook_data}"}'
                    }
                }
            },
            {
                id: 'send-1',
                type: 'custom',
                position: { x: 250, y: 350 },
                data: {
                    label: 'Notify Team',
                    type: 'send-email',
                    config: {
                        message: 'New webhook received and processed successfully.'
                    }
                }
            }
        ],
        edges: [
            { id: 'e1-2', source: 'trigger-1', target: 'http-1' },
            { id: 'e2-3', source: 'http-1', target: 'send-1' }
        ]
    }
]

export function getTemplateById(id: string): WorkflowTemplate | undefined {
    return WORKFLOW_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(t => t.category === category)
}

export const TEMPLATE_CATEGORIES = [
    'Customer Service',
    'Automation',
    'AI',
    'Integration'
]
