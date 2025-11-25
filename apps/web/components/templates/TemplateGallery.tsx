'use client'

import { useState, useEffect } from 'react'
import { Button } from '@wataomi/ui'
import { fetchAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import {
    FiSearch,
    FiFilter,
    FiX,
    FiCheck,
    FiTrendingUp
} from 'react-icons/fi'

interface Template {
    id: number
    name: string
    description: string
    category: string
    icon: string
    usage_count: number
    is_public: boolean
}

interface TemplateGalleryProps {
    onSelectTemplate: (template: Template) => void
    onClose: () => void
}

const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'customer-service', label: 'Customer Service' },
    { value: 'sales', label: 'Sales' },
    { value: 'automation', label: 'Automation' },
    { value: 'marketing', label: 'Marketing' }
]

export function TemplateGallery({ onSelectTemplate, onClose }: TemplateGalleryProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

    useEffect(() => {
        loadTemplates()
    }, [])

    useEffect(() => {
        filterTemplates()
    }, [templates, searchQuery, selectedCategory])

    const loadTemplates = async () => {
        try {
            setLoading(true)
            const data = await fetchAPI('/templates/')
            setTemplates(data)
        } catch (e: any) {
            toast.error('Failed to load templates')
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const filterTemplates = () => {
        let filtered = templates

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(t => t.category === selectedCategory)
        }

        // Filter by search
        if (searchQuery) {
            filtered = filtered.filter(t =>
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        setFilteredTemplates(filtered)
    }

    const handleUseTemplate = async (template: Template) => {
        try {
            await fetchAPI(`/templates/${template.id}/use`, { method: 'POST' })
            onSelectTemplate(template)
            toast.success('Template loaded!')
        } catch (e: any) {
            toast.error('Failed to use template')
            console.error(e)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Flow Templates</h2>
                        <p className="text-sm text-zinc-400 mt-1">Start with a pre-built flow</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="p-6 border-b border-zinc-800 space-y-4">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {categories.map(cat => (
                            <button
                                key={cat.value}
                                onClick={() => setSelectedCategory(cat.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedCategory === cat.value
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-12 text-zinc-400">Loading templates...</div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400">No templates found</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTemplates.map(template => (
                                <div
                                    key={template.id}
                                    className={`p-6 bg-zinc-800/50 border rounded-xl hover:border-purple-500 transition-all cursor-pointer ${
                                        selectedTemplate?.id === template.id
                                            ? 'border-purple-500 ring-2 ring-purple-500/20'
                                            : 'border-zinc-700'
                                    }`}
                                    onClick={() => setSelectedTemplate(template)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="text-4xl">{template.icon}</div>
                                        {template.is_public && (
                                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                                                Public
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                                    <p className="text-sm text-zinc-400 mb-4">{template.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                                            <FiTrendingUp className="w-3 h-3" />
                                            {template.usage_count} uses
                                        </div>
                                        <span className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs rounded">
                                            {template.category}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                    <Button
                        onClick={onClose}
                        className="bg-zinc-800 hover:bg-zinc-700"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => selectedTemplate && handleUseTemplate(selectedTemplate)}
                        disabled={!selectedTemplate}
                        className="bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                        <FiCheck className="w-4 h-4 mr-2" />
                        Use Template
                    </Button>
                </div>
            </div>
        </div>
    )
}
