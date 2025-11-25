import {
    FiMessageSquare,
    FiSend,
    FiGitBranch,
    FiClock,
    FiDatabase,
    FiCode,
    FiMail,
    FiPhone,
    FiSlack,
    FiZap,
    FiFilter,
    FiRepeat,
    FiCheckCircle,
    FiAlertCircle,
    FiImage,
    FiFile,
    FiUpload
} from 'react-icons/fi'
import {
    SiOpenai,
    SiGoogle,
    SiFacebook,
    SiWhatsapp,
    SiTelegram,
    SiInstagram
} from 'react-icons/si'
import {
    MdAutoAwesome,
    MdSmartToy,
    MdTransform
} from 'react-icons/md'

export interface NodeType {
    id: string
    label: string
    category: 'trigger' | 'action' | 'logic' | 'ai' | 'messaging' | 'integration' | 'media'
    icon: any
    color: string
    bgColor: string
    borderColor: string
    description: string
}

export const NODE_TYPES: NodeType[] = [
    // TRIGGERS
    {
        id: 'trigger-webhook',
        label: 'Webhook',
        category: 'trigger',
        icon: FiZap,
        color: '#10b981',
        bgColor: '#10b981',
        borderColor: '#059669',
        description: 'Trigger workflow via HTTP webhook'
    },
    {
        id: 'trigger-schedule',
        label: 'Schedule',
        category: 'trigger',
        icon: FiClock,
        color: '#3b82f6',
        bgColor: '#3b82f6',
        borderColor: '#2563eb',
        description: 'Run workflow on schedule'
    },
    {
        id: 'trigger-message',
        label: 'New Message',
        category: 'trigger',
        icon: FiMessageSquare,
        color: '#8b5cf6',
        bgColor: '#8b5cf6',
        borderColor: '#7c3aed',
        description: 'Trigger on new incoming message'
    },

    // MESSAGING
    {
        id: 'send-whatsapp',
        label: 'WhatsApp',
        category: 'messaging',
        icon: SiWhatsapp,
        color: '#25D366',
        bgColor: '#25D366',
        borderColor: '#128C7E',
        description: 'Send WhatsApp message'
    },
    {
        id: 'send-telegram',
        label: 'Telegram',
        category: 'messaging',
        icon: SiTelegram,
        color: '#0088CC',
        bgColor: '#0088CC',
        borderColor: '#0077B5',
        description: 'Send Telegram message'
    },
    {
        id: 'send-messenger',
        label: 'Messenger',
        category: 'messaging',
        icon: SiFacebook,
        color: '#0084FF',
        bgColor: '#0084FF',
        borderColor: '#0066CC',
        description: 'Send Facebook Messenger message'
    },
    {
        id: 'send-instagram',
        label: 'Instagram',
        category: 'messaging',
        icon: SiInstagram,
        color: '#E4405F',
        bgColor: '#E4405F',
        borderColor: '#C13584',
        description: 'Send Instagram DM'
    },
    {
        id: 'send-email',
        label: 'Email',
        category: 'messaging',
        icon: FiMail,
        color: '#ea4335',
        bgColor: '#ea4335',
        borderColor: '#d33426',
        description: 'Send email'
    },
    {
        id: 'send-sms',
        label: 'SMS',
        category: 'messaging',
        icon: FiPhone,
        color: '#f59e0b',
        bgColor: '#f59e0b',
        borderColor: '#d97706',
        description: 'Send SMS message'
    },

    // AI NODES
    {
        id: 'ai-suggest',
        label: 'AI Suggest',
        category: 'ai',
        icon: MdAutoAwesome,
        color: '#a855f7',
        bgColor: '#a855f7',
        borderColor: '#9333ea',
        description: 'Generate AI response suggestions'
    },
    {
        id: 'ai-openai',
        label: 'OpenAI',
        category: 'ai',
        icon: SiOpenai,
        color: '#10a37f',
        bgColor: '#10a37f',
        borderColor: '#0d8968',
        description: 'Call OpenAI API (GPT-4, etc.)'
    },
    {
        id: 'ai-gemini',
        label: 'Gemini',
        category: 'ai',
        icon: SiGoogle,
        bgColor: '#4285f4',
        color: '#4285f4',
        borderColor: '#3367d6',
        description: 'Call Google Gemini API'
    },
    {
        id: 'ai-classify',
        label: 'Classify',
        category: 'ai',
        icon: MdSmartToy,
        color: '#ec4899',
        bgColor: '#ec4899',
        borderColor: '#db2777',
        description: 'Classify text with AI'
    },

    // LOGIC
    {
        id: 'logic-condition',
        label: 'Condition',
        category: 'logic',
        icon: FiGitBranch,
        color: '#f59e0b',
        bgColor: '#f59e0b',
        borderColor: '#d97706',
        description: 'Branch workflow based on condition'
    },
    {
        id: 'logic-filter',
        label: 'Filter',
        category: 'logic',
        icon: FiFilter,
        color: '#06b6d4',
        bgColor: '#06b6d4',
        borderColor: '#0891b2',
        description: 'Filter items based on criteria'
    },
    {
        id: 'logic-loop',
        label: 'Loop',
        category: 'logic',
        icon: FiRepeat,
        color: '#8b5cf6',
        bgColor: '#8b5cf6',
        borderColor: '#7c3aed',
        description: 'Iterate over items'
    },
    {
        id: 'logic-transform',
        label: 'Transform',
        category: 'logic',
        icon: MdTransform,
        color: '#14b8a6',
        bgColor: '#14b8a6',
        borderColor: '#0d9488',
        description: 'Transform data structure'
    },

    // ACTIONS
    {
        id: 'action-http',
        label: 'HTTP Request',
        category: 'action',
        icon: FiSend,
        color: '#6366f1',
        bgColor: '#6366f1',
        borderColor: '#4f46e5',
        description: 'Make HTTP API request'
    },
    {
        id: 'action-database',
        label: 'Database',
        category: 'action',
        icon: FiDatabase,
        color: '#0ea5e9',
        bgColor: '#0ea5e9',
        borderColor: '#0284c7',
        description: 'Query or update database'
    },
    {
        id: 'action-code',
        label: 'Code',
        category: 'action',
        icon: FiCode,
        color: '#64748b',
        bgColor: '#64748b',
        borderColor: '#475569',
        description: 'Execute custom JavaScript code'
    },

    // INTEGRATIONS
    {
        id: 'integration-slack',
        label: 'Slack',
        category: 'integration',
        icon: FiSlack,
        color: '#4A154B',
        bgColor: '#4A154B',
        borderColor: '#350d36',
        description: 'Send Slack notification'
    },

    // MEDIA
    {
        id: 'media-upload-image',
        label: 'Upload Image',
        category: 'media',
        icon: FiImage,
        color: '#ec4899',
        bgColor: '#ec4899',
        borderColor: '#db2777',
        description: 'Upload image to Cloudinary'
    },
    {
        id: 'media-upload-file',
        label: 'Upload File',
        category: 'media',
        icon: FiFile,
        color: '#8b5cf6',
        bgColor: '#8b5cf6',
        borderColor: '#7c3aed',
        description: 'Upload file to Cloudinary'
    },
    {
        id: 'media-send-image',
        label: 'Send Image',
        category: 'media',
        icon: FiUpload,
        color: '#06b6d4',
        bgColor: '#06b6d4',
        borderColor: '#0891b2',
        description: 'Send image in message'
    },
]

export const NODE_CATEGORIES = [
    { id: 'trigger', label: 'Triggers', color: '#10b981' },
    { id: 'messaging', label: 'Messaging', color: '#0084FF' },
    { id: 'ai', label: 'AI & Logic', color: '#a855f7' },
    { id: 'logic', label: 'Flow Control', color: '#f59e0b' },
    { id: 'action', label: 'Actions', color: '#6366f1' },
    { id: 'media', label: 'Media', color: '#ec4899' },
    { id: 'integration', label: 'Integrations', color: '#4A154B' },
]

export function getNodeType(id: string): NodeType | undefined {
    return NODE_TYPES.find(type => type.id === id)
}

export function getNodesByCategory(category: string): NodeType[] {
    return NODE_TYPES.filter(type => type.category === category)
}
