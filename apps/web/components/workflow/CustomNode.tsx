'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { getNodeType } from '@/lib/nodeTypes'

interface CustomNodeData {
    label: string
    type: string
    config?: Record<string, any>
}

function CustomNode({ data, selected }: NodeProps<CustomNodeData>) {
    const nodeType = getNodeType(data.type)

    if (!nodeType) {
        return (
            <div className="px-4 py-2 shadow-lg rounded-lg bg-gray-500 border-2 border-gray-600">
                <div className="text-white text-sm">{data.label}</div>
            </div>
        )
    }

    const Icon = nodeType.icon
    const isAI = nodeType.category === 'ai'
    const isTrigger = nodeType.category === 'trigger'
    const isMediaNode = data.type?.startsWith('media-')
    
    // Support both media_file object and media_url string
    const mediaFile = data.config?.media_file
    const mediaUrl = data.config?.media_url
    const hasUploadedMedia = mediaFile?.url || mediaUrl
    
    // Debug log
    console.log('CustomNode render:', {
        type: data.type,
        isMediaNode,
        hasUploadedMedia,
        mediaFile,
        mediaUrl,
        config: data.config
    })

    return (
        <div
            className={`
                relative px-4 py-3 shadow-lg rounded-lg border-2 transition-all
                ${selected ? 'ring-2 ring-offset-2 ring-offset-background' : ''}
                hover:shadow-xl
            `}
            style={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: nodeType.borderColor,
                ...(selected && { ringColor: nodeType.color })
            }}
        >
            {/* Input Handle - không có cho trigger nodes */}
            {!isTrigger && (
                <Handle
                    type="target"
                    position={Position.Top}
                    className="w-3 h-3"
                    style={{
                        background: nodeType.color,
                        border: `2px solid ${nodeType.borderColor}`
                    }}
                />
            )}

            {/* Node Content */}
            <div className="flex items-center gap-3 min-w-[180px]">
                {/* Icon */}
                <div
                    className="p-2 rounded-lg flex items-center justify-center"
                    style={{
                        backgroundColor: `${nodeType.bgColor}20`,
                        color: nodeType.color
                    }}
                >
                    <Icon className="w-5 h-5" />
                </div>

                {/* Label */}
                <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">
                        {data.label}
                    </div>
                    {data.config && Object.keys(data.config).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                            Configured
                        </div>
                    )}
                </div>

                {/* AI Badge */}
                {isAI && (
                    <div
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                            backgroundColor: `${nodeType.color}20`,
                            color: nodeType.color
                        }}
                    >
                        AI
                    </div>
                )}
            </div>

            {/* Media Preview - Show uploaded image/file */}
            {isMediaNode && hasUploadedMedia && (
                <div className="mt-3 pt-3 border-t border-border/40">
                    {data.type.includes('image') ? (
                        <img 
                            src={mediaFile?.url || mediaUrl} 
                            alt="Preview" 
                            className="w-full h-24 object-cover rounded"
                        />
                    ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                📄
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="truncate font-medium">
                                    {mediaFile?.filename || 'Uploaded file'}
                                </div>
                                {mediaFile?.size && (
                                    <div className="text-xs">
                                        {(mediaFile.size / 1024).toFixed(1)} KB
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Category Indicator */}
            <div
                className="absolute -top-1 -left-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: nodeType.color }}
            />

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3"
                style={{
                    background: nodeType.color,
                    border: `2px solid ${nodeType.borderColor}`
                }}
            />
        </div>
    )
}

export default memo(CustomNode)
