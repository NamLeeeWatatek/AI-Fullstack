'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@wataomi/ui'
import { fetchAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { FiX, FiCheck } from 'react-icons/fi'

interface Template {
    id: string
    name: string
    description: string
    category: string
    thumbnail: string
}

interface N8NTemplateSelectorProps {
    onSelect: (templateData: any) => void
    onClose: () => void
}

export function N8NTemplateSelector({ onSelect, onClose }: N8NTemplateSelectorProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        try {
            const data = await fetchAPI('/n8n-templates/')
            setTemplates(data)
        } catch (e: any) {
            toast.error('Failed to load templates')
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = async () => {
        if (!selectedId) return

        try {
            const templateData = await fetchAPI(`/n8n-templates/${selectedId}`)
            console.log('Template data received:', templateData)
            
            // Ensure data is properly formatted
            if (!templateData.nodes || !Array.isArray(templateData.nodes)) {
                throw new Error('Invalid template data: missing nodes')
            }
            
            onSelect(templateData)
            toast.success('Template loaded! Redirecting...')
        } catch (e: any) {
            console.error('Template load error:', e)
            toast.error('Failed to load template: ' + e.message)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-border/40">
                {/* Header */}
                <div className="p-6 border-b border-border/40 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">N8N Workflow Templates</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Chọn template để bắt đầu nhanh với N8N integration
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Templates Grid */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
                    {loading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Loading templates...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => setSelectedId(template.id)}
                                    className={`text-left p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                                        selectedId === template.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border/40 hover:border-primary/40'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-5xl">{template.thumbnail}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-semibold">{template.name}</h3>
                                                {selectedId === template.id && (
                                                    <FiCheck className="w-5 h-5 text-primary" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {template.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border/40 flex items-center justify-between">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSelect}
                        disabled={!selectedId}
                    >
                        Use Template
                    </Button>
                </div>
            </div>
        </div>
    )
}
