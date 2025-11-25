'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@wataomi/ui'
import { FiSave, FiUpload, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import type { Node } from 'reactflow'
import { fetchAPI } from '@/lib/api'
import { getNodeType } from '@/lib/nodeTypes'

interface NodePropertiesProps {
    node: Node
    onUpdate: (node: Node) => void
}

interface Channel {
    id: number
    name: string
    type: string
}

export function NodeProperties({ node, onUpdate }: NodePropertiesProps) {
    const nodeData = node.data as any
    const [config, setConfig] = useState(nodeData.config || {})
    const [channels, setChannels] = useState<Channel[]>([])
    const [loadingChannels, setLoadingChannels] = useState(false)
    
    // Media upload state
    const [uploading, setUploading] = useState(false)
    const [uploadedFile, setUploadedFile] = useState<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Get node type info for display
    const nodeTypeInfo = getNodeType(nodeData.type)

    // Sync config and uploadedFile when node changes
    useEffect(() => {
        console.log('Node changed, config:', nodeData.config)
        setConfig(nodeData.config || {})
        
        // Support both media_file object and media_url string
        if (nodeData.config?.media_file) {
            console.log('Setting uploaded file from media_file:', nodeData.config.media_file)
            setUploadedFile(nodeData.config.media_file)
        } else if (nodeData.config?.media_url) {
            // Reconstruct media_file from media_url
            console.log('Reconstructing media_file from media_url:', nodeData.config.media_url)
            const reconstructed = {
                url: nodeData.config.media_url,
                filename: nodeData.config.media_url.split('/').pop() || 'file',
                size: 0 // Unknown size
            }
            setUploadedFile(reconstructed)
        } else {
            setUploadedFile(null)
        }
    }, [node.id, nodeData.config])

    useEffect(() => {
        // Fetch channels if node type is messaging
        if (nodeData.type?.startsWith('send-')) {
            loadChannels()
        }
    }, [nodeData.type])

    const loadChannels = async () => {
        try {
            setLoadingChannels(true)
            const data = await fetchAPI('/channels/')
            setChannels(data)
        } catch (e) {
            console.error('Failed to load channels')
        } finally {
            setLoadingChannels(false)
        }
    }

    const handleUpdate = () => {
        onUpdate({
            ...node,
            data: {
                ...nodeData,
                config
            }
        })
        toast.success('Node configuration saved!')
    }
    
    // Check if there are unsaved changes
    const hasChanges = () => {
        return JSON.stringify(config) !== JSON.stringify(nodeData.config || {})
    }

    const updateConfig = (key: string, value: any) => {
        const newConfig = { ...config, [key]: value }
        setConfig(newConfig)
        
        // Auto-update node when media is uploaded/removed
        if (key === 'media_file' || key === 'media_url') {
            onUpdate({
                ...node,
                data: {
                    ...nodeData,
                    config: newConfig
                }
            })
        }
    }
    
    // Render N8N integration node config
    const renderN8NConfigForm = (nodeType: string) => {
        if (nodeType === 'n8n-video-generator') {
            return (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Video Prompt <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={config.prompt || ''}
                            onChange={(e) => updateConfig('prompt', e.target.value)}
                            className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={4}
                            placeholder="Tạo video 15 giây giới thiệu túi xách nữ sang trọng, ánh sáng ban ngày, phong cách tự nhiên..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Mô tả chi tiết về video bạn muốn tạo
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Product Images <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {(config.images || []).map((img: string, idx: number) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="url"
                                        value={img}
                                        onChange={(e) => {
                                            const newImages = [...(config.images || [])]
                                            newImages[idx] = e.target.value
                                            updateConfig('images', newImages)
                                        }}
                                        className="flex-1 glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    <button
                                        onClick={() => {
                                            const newImages = (config.images || []).filter((_: any, i: number) => i !== idx)
                                            updateConfig('images', newImages)
                                        }}
                                        className="p-2 hover:bg-red-500/10 rounded text-red-500"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    updateConfig('images', [...(config.images || []), ''])
                                }}
                                className="w-full p-2 border-2 border-dashed border-border/40 rounded-lg hover:border-primary/40 transition-colors text-sm"
                            >
                                + Add Image URL
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tối đa 5 hình ảnh sản phẩm
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Social Platforms <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {['facebook', 'instagram', 'tiktok', 'youtube'].map((platform) => (
                                <label key={platform} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={(config.platforms || []).includes(platform)}
                                        onChange={(e) => {
                                            const platforms = config.platforms || []
                                            if (e.target.checked) {
                                                updateConfig('platforms', [...platforms, platform])
                                            } else {
                                                updateConfig('platforms', platforms.filter((p: string) => p !== platform))
                                            }
                                        }}
                                        className="rounded"
                                    />
                                    <span className="text-sm capitalize">{platform}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            N8N Endpoint
                        </label>
                        <select
                            value={config.n8n_env || 'test'}
                            onChange={(e) => updateConfig('n8n_env', e.target.value)}
                            className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="test">Test Environment</option>
                            <option value="production">Production</option>
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Test: Free testing | Production: Real video generation
                        </p>
                    </div>
                </>
            )
        }
        
        if (nodeType === 'n8n-webhook') {
            return (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Webhook URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            value={config.webhook_url || ''}
                            onChange={(e) => updateConfig('webhook_url', e.target.value)}
                            className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="https://n8n.example.com/webhook/..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Request Body (JSON)
                        </label>
                        <textarea
                            value={config.body || '{}'}
                            onChange={(e) => updateConfig('body', e.target.value)}
                            className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs"
                            rows={6}
                            placeholder='{"key": "value"}'
                        />
                    </div>
                </>
            )
        }
        
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                N8N integration node - Configure in properties
            </div>
        )
    }

    // Render different config forms based on node type
    const renderConfigForm = () => {
        const nodeType = nodeData.type
        
        // N8N Integration Nodes
        if (nodeType?.startsWith('n8n-')) {
            return renderN8NConfigForm(nodeType)
        }

        // AI Nodes
        if (nodeType === 'ai-suggest' || nodeType === 'ai-openai' || nodeType === 'ai-gemini') {
            return (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            AI Prompt <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={config.prompt || ''}
                            onChange={(e) => updateConfig('prompt', e.target.value)}
                            className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={4}
                            placeholder="Enter your AI prompt here..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Use variables: {'{customer_message}'}, {'{customer_name}'}
                        </p>
                    </div>

                    {nodeType === 'ai-openai' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-2">Model</label>
                                <select
                                    value={config.model || 'gpt-4'}
                                    onChange={(e) => updateConfig('model', e.target.value)}
                                    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="gpt-4">GPT-4</option>
                                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Temperature: {config.temperature || 0.7}
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={config.temperature || 0.7}
                                    onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                                    className="w-full"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Lower = more focused, Higher = more creative
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Max Tokens</label>
                                <input
                                    type="number"
                                    value={config.max_tokens || 150}
                                    onChange={(e) => updateConfig('max_tokens', parseInt(e.target.value))}
                                    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    min="1"
                                    max="4000"
                                />
                            </div>
                        </>
                    )}

                    {nodeType === 'ai-gemini' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Model</label>
                            <select
                                value={config.model || 'gemini-pro'}
                                onChange={(e) => updateConfig('model', e.target.value)}
                                className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="gemini-pro">Gemini Pro</option>
                                <option value="gemini-pro-vision">Gemini Pro Vision</option>
                            </select>
                        </div>
                    )}
                </>
            )
        }

        // Classify Node
        if (nodeType === 'ai-classify') {
            return (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Categories <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={config.categories?.join('\n') || ''}
                            onChange={(e) => updateConfig('categories', e.target.value.split('\n').filter(Boolean))}
                            className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={5}
                            placeholder="urgent&#10;question&#10;complaint&#10;feedback&#10;other"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            One category per line
                        </p>
                    </div>
                </>
            )
        }

        // Message Nodes
        if (nodeType?.startsWith('send-')) {
            const platform = nodeType.replace('send-', '')
            // Filter channels for this platform
            const platformChannels = channels.filter(c => c.type === platform)

            return (
                <>
                    {/* Channel Selection */}
                    {platformChannels.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Select Account <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={config.channel_id || ''}
                                onChange={(e) => updateConfig('channel_id', parseInt(e.target.value))}
                                className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Select an account...</option>
                                {platformChannels.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {platformChannels.length === 0 && !loadingChannels && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-500 mb-4">
                            No connected {platform} accounts found. Please connect one in Channels settings.
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Message Template <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={config.message || ''}
                            onChange={(e) => updateConfig('message', e.target.value)}
                            className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={4}
                            placeholder={`Enter ${platform} message template...`}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Use variables: {'{ai_response}'}, {'{customer_name}'}
                        </p>
                    </div>

                    {platform === 'whatsapp' && (
                        <div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={config.use_template || false}
                                    onChange={(e) => updateConfig('use_template', e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm">Use WhatsApp Template</span>
                            </label>
                            {config.use_template && (
                                <input
                                    type="text"
                                    value={config.template_name || ''}
                                    onChange={(e) => updateConfig('template_name', e.target.value)}
                                    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 mt-2"
                                    placeholder="Template name"
                                />
                            )}
                        </div>
                    )}
                </>
            )
        }

        // Media Nodes
        if (nodeType?.startsWith('media-')) {
            const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0]
                if (!file) return

                // Validate file type
                const isImage = nodeType.includes('image')
                if (isImage && !file.type.startsWith('image/')) {
                    toast.error('Please select an image file')
                    return
                }

                // Validate size
                const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024 // 5MB for images, 10MB for files
                if (file.size > maxSize) {
                    toast.error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`)
                    return
                }

                try {
                    setUploading(true)
                    
                    // Upload to backend
                    const formData = new FormData()
                    formData.append('file', file)
                    
                    const endpoint = isImage ? '/media/upload/image' : '/media/upload/file'
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}${endpoint}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('wataomi_token')}`
                        },
                        body: formData
                    })

                    if (!response.ok) throw new Error('Upload failed')

                    const result = await response.json()
                    
                    // Save uploaded file info
                    const fileInfo = {
                        id: result.id,
                        public_id: result.public_id,
                        url: result.secure_url,
                        filename: file.name,
                        size: file.size,
                        type: file.type
                    }
                    
                    setUploadedFile(fileInfo)
                    updateConfig('media_file', fileInfo)
                    updateConfig('media_url', result.secure_url)
                    
                    toast.success('File uploaded successfully!')
                } catch (error: any) {
                    toast.error('Upload failed: ' + (error.message || 'Unknown error'))
                } finally {
                    setUploading(false)
                }
            }

            const handleRemoveFile = async () => {
                if (!uploadedFile) return

                try {
                    // Delete from backend
                    await fetchAPI(`/media/${encodeURIComponent(uploadedFile.public_id)}`, {
                        method: 'DELETE'
                    })
                    
                    setUploadedFile(null)
                    updateConfig('media_file', null)
                    updateConfig('media_url', '')
                    
                    toast.success('File removed')
                } catch (error: any) {
                    toast.error('Failed to remove file')
                }
            }

            return (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {nodeType.includes('image') ? 'Image' : 'File'} Upload
                        </label>
                        
                        {!uploadedFile ? (
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={nodeType.includes('image') ? 'image/*' : '*/*'}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-full p-4 border-2 border-dashed border-border/40 rounded-lg hover:border-primary/40 transition-colors text-center"
                                >
                                    {uploading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span>Uploading...</span>
                                        </div>
                                    ) : (
                                        <div>
                                            <FiUpload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                            <p className="text-sm font-medium">Click to upload</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {nodeType.includes('image') 
                                                    ? 'PNG, JPG, GIF up to 5MB'
                                                    : 'Any file up to 10MB'
                                                }
                                            </p>
                                        </div>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                {nodeType.includes('image') && uploadedFile.url && (
                                    <img 
                                        src={uploadedFile.url} 
                                        alt="Uploaded" 
                                        className="w-full h-32 object-cover rounded mb-2"
                                    />
                                )}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{uploadedFile.filename}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(uploadedFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleRemoveFile}
                                        className="ml-2 p-2 hover:bg-red-500/10 rounded text-red-500"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {nodeType === 'media-send-image' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Caption (Optional)
                            </label>
                            <textarea
                                value={config.caption || ''}
                                onChange={(e) => updateConfig('caption', e.target.value)}
                                className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                rows={2}
                                placeholder="Image caption..."
                            />
                        </div>
                    )}
                </>
            )
        }

        // HTTP Request Node
        if (nodeType === 'action-http') {
            return (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            value={config.url || ''}
                            onChange={(e) => updateConfig('url', e.target.value)}
                            className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="https://api.example.com/endpoint"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Method</label>
                        <select
                            value={config.method || 'GET'}
                            onChange={(e) => updateConfig('method', e.target.value)}
                            className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="PATCH">PATCH</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Headers (JSON)</label>
                        <textarea
                            value={config.headers || '{}'}
                            onChange={(e) => updateConfig('headers', e.target.value)}
                            className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs"
                            rows={3}
                            placeholder='{"Content-Type": "application/json"}'
                        />
                    </div>

                    {(config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH') && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Body (JSON)</label>
                            <textarea
                                value={config.body || '{}'}
                                onChange={(e) => updateConfig('body', e.target.value)}
                                className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs"
                                rows={4}
                                placeholder='{"key": "value"}'
                            />
                        </div>
                    )}
                </>
            )
        }

        // Condition Node
        if (nodeType === 'logic-condition') {
            return (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Condition <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={config.operator || 'equals'}
                            onChange={(e) => updateConfig('operator', e.target.value)}
                            className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="equals">Equals</option>
                            <option value="not_equals">Not Equals</option>
                            <option value="contains">Contains</option>
                            <option value="not_contains">Not Contains</option>
                            <option value="greater_than">Greater Than</option>
                            <option value="less_than">Less Than</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Value</label>
                        <input
                            type="text"
                            value={config.value || ''}
                            onChange={(e) => updateConfig('value', e.target.value)}
                            className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Comparison value"
                        />
                    </div>
                </>
            )
        }

        // Code Node
        if (nodeType === 'action-code') {
            return (
                <div>
                    <label className="block text-sm font-medium mb-2">
                        JavaScript Code <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={config.code || ''}
                        onChange={(e) => updateConfig('code', e.target.value)}
                        className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs"
                        rows={10}
                        placeholder="// Your code here&#10;return { result: 'value' };"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Access input data via <code className="bg-muted px-1 rounded">input</code> variable
                    </p>
                </div>
            )
        }

        // Default - no specific config
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                No additional configuration needed for this node type
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Node Info Header - Read Only */}
            <div className="p-3 glass rounded-lg border border-border/40">
                <div className="flex items-center gap-3 mb-2">
                    {nodeTypeInfo?.icon && (
                        <div
                            className="p-2 rounded-lg flex items-center justify-center"
                            style={{
                                backgroundColor: `${nodeTypeInfo.bgColor}20`,
                                color: nodeTypeInfo.color
                            }}
                        >
                            <nodeTypeInfo.icon className="w-5 h-5" />
                        </div>
                    )}
                    <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground">
                            {nodeData.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {nodeTypeInfo?.label || nodeData.type}
                        </div>
                    </div>
                </div>
            </div>

            {renderConfigForm()}

            {hasChanges() && (
                <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-500 mb-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    Unsaved changes
                </div>
            )}
            
            <Button onClick={handleUpdate} className="w-full">
                <FiSave className="w-4 h-4 mr-2" />
                Save Configuration
            </Button>
        </div>
    )
}
