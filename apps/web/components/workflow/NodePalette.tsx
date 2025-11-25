'use client'

import { useState } from 'react'
import { NODE_CATEGORIES, getNodesByCategory, NodeType } from '@/lib/nodeTypes'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'

interface NodePaletteProps {
    onAddNode: (nodeType: NodeType) => void
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
    const [expandedCategories, setExpandedCategories] = useState<string[]>([
        'trigger',
        'messaging',
        'ai'
    ])

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        )
    }

    const handleDragStart = (event: React.DragEvent, nodeType: NodeType) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType))
        event.dataTransfer.effectAllowed = 'move'
    }

    return (
        <div className="w-64 border-r border-border/40 bg-background flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border/40">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Add Node
                </h3>
            </div>

            {/* Node Categories */}
            <div className="flex-1 overflow-y-auto p-2">
                {NODE_CATEGORIES.map((category) => {
                    const isExpanded = expandedCategories.includes(category.id)
                    const nodes = getNodesByCategory(category.id)

                    return (
                        <div key={category.id} className="mb-2">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <span className="text-sm font-medium">
                                        {category.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        ({nodes.length})
                                    </span>
                                </div>
                                {isExpanded ? (
                                    <FiChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <FiChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                            </button>

                            {/* Nodes List */}
                            {isExpanded && (
                                <div className="mt-1 space-y-1 pl-2">
                                    {nodes.map((nodeType) => {
                                        const Icon = nodeType.icon
                                        return (
                                            <div
                                                key={nodeType.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, nodeType)}
                                                onClick={() => onAddNode(nodeType)}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent cursor-move transition-all group border border-transparent hover:border-border/40"
                                                title={nodeType.description}
                                            >
                                                <div
                                                    className="p-1.5 rounded flex items-center justify-center"
                                                    style={{
                                                        backgroundColor: `${nodeType.bgColor}20`,
                                                        color: nodeType.color
                                                    }}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">
                                                        {nodeType.label}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {nodeType.description}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Footer Hint */}
            <div className="p-4 border-t border-border/40 bg-muted/20">
                <p className="text-xs text-muted-foreground text-center">
                    Drag & drop nodes to canvas
                </p>
            </div>
        </div>
    )
}
