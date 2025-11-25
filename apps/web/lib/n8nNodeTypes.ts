/**
 * N8N Integration Node Types
 * Special nodes for integrating with n8n workflows
 */
import { FiZap, FiVideo, FiFileText, FiShare2 } from 'react-icons/fi'
import { NodeType } from './nodeTypes'

export const N8N_NODE_TYPES: NodeType[] = [
    {
        id: 'n8n-video-generator',
        label: 'N8N Video Generator',
        category: 'integration',
        icon: FiVideo,
        color: '#FF6D5A',
        bgColor: '#FF6D5A',
        borderColor: '#FF6D5A',
        description: 'Generate video ads using n8n workflow with AI'
    },
    {
        id: 'n8n-seo-writer',
        label: 'N8N SEO Writer',
        category: 'integration',
        icon: FiFileText,
        color: '#4CAF50',
        bgColor: '#4CAF50',
        borderColor: '#4CAF50',
        description: 'Auto-generate SEO optimized content via n8n'
    },
    {
        id: 'n8n-omnipost',
        label: 'N8N OmniPost',
        category: 'integration',
        icon: FiShare2,
        color: '#2196F3',
        bgColor: '#2196F3',
        borderColor: '#2196F3',
        description: 'Post content to multiple social platforms via n8n'
    },
    {
        id: 'n8n-webhook',
        label: 'N8N Webhook',
        category: 'integration',
        icon: FiZap,
        color: '#9C27B0',
        bgColor: '#9C27B0',
        borderColor: '#9C27B0',
        description: 'Call custom n8n webhook endpoint'
    }
]

// N8N Webhook endpoints configuration
export const N8N_ENDPOINTS = {
    VIDEO_GENERATOR: {
        production: 'https://n8n.srv1078465.hstgr.cloud/webhook/wh-generate-video-ugc-ads-autopost-social',
        test: 'https://watacorp.app.n8n.cloud/webhook/video-ads'
    },
    SEO_WRITER: {
        production: 'https://n8n.srv1078465.hstgr.cloud/webhook/seo-writer',
        test: 'https://watacorp.app.n8n.cloud/webhook/seo-writer-test'
    },
    OMNIPOST: {
        production: 'https://n8n.srv1078465.hstgr.cloud/webhook/omnipost',
        test: 'https://watacorp.app.n8n.cloud/webhook/omnipost-test'
    }
}

// Helper to get endpoint based on environment
export function getN8NEndpoint(nodeType: string, useProduction: boolean = false): string {
    const env = useProduction ? 'production' : 'test'
    
    switch (nodeType) {
        case 'n8n-video-generator':
            return N8N_ENDPOINTS.VIDEO_GENERATOR[env]
        case 'n8n-seo-writer':
            return N8N_ENDPOINTS.SEO_WRITER[env]
        case 'n8n-omnipost':
            return N8N_ENDPOINTS.OMNIPOST[env]
        default:
            return ''
    }
}
