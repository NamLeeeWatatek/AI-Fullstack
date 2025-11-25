'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    FiPlus,
    FiGrid,
    FiList,
    FiLoader,
    FiPlay,
    FiMoreVertical,
    FiEdit,
    FiCopy,
    FiArchive,
    FiTrash2
} from 'react-icons/fi'
import { Button } from '@wataomi/ui'
import { WorkflowCard } from '@/components/workflows/workflow-card'
import { SearchBar } from '@/components/workflows/search-bar'
import { FilterBar } from '@/components/workflows/filter-bar'
import { WorkflowStats } from '@/components/workflows/workflow-stats'
import { fetchAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { N8NTemplateSelector } from '@/components/templates/N8NTemplateSelector'

interface Flow {
    id: number
    name: string
    description: string
    is_active: boolean
    created_at: string
    updated_at: string
    user_id: string
    flow_data: Record<string, unknown>
    status: string
    executions?: number
    successRate?: number
    version?: number
}

interface ApiFlow {
    id: number
    name: string
    description: string
    is_active: boolean
    created_at: string
    updated_at: string
    user_id: string
    flow_data: Record<string, unknown>
}

// Dropdown Menu Component
function FlowDropdownMenu({ flow, onAction }: { flow: Flow; onAction: () => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const handleEdit = () => {
        router.push(`/flows/${flow.id}/edit`)
    }

    const handleDuplicate = async () => {
        setIsOpen(false)
        const duplicatePromise = fetchAPI(`/flows/${flow.id}/duplicate`, { method: 'POST' })
            .then((dup) => {
                router.push(`/flows/${dup.id}/edit`)
                return dup
            })

        toast.promise(duplicatePromise, {
            loading: 'Duplicating workflow...',
            success: 'Workflow duplicated successfully!',
            error: (err) => `Failed to duplicate: ${err.message}`,
        })
    }

    const handlePublish = async () => {
        setIsOpen(false)
        const publishPromise = fetchAPI(`/flows/${flow.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'published' })
        }).then(() => {
            onAction()
        })

        toast.promise(publishPromise, {
            loading: 'Publishing workflow...',
            success: 'Workflow published successfully!',
            error: (err) => `Failed to publish: ${err.message}`,
        })
    }

    const handleUnpublish = async () => {
        setIsOpen(false)
        const unpublishPromise = fetchAPI(`/flows/${flow.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'draft' })
        }).then(() => {
            onAction()
        })

        toast.promise(unpublishPromise, {
            loading: 'Unpublishing workflow...',
            success: 'Workflow unpublished successfully!',
            error: (err) => `Failed to unpublish: ${err.message}`,
        })
    }

    const handleArchive = async () => {
        setIsOpen(false)
        const archivePromise = fetchAPI(`/flows/${flow.id}/archive`, { method: 'POST' })
            .then(() => {
                onAction()
            })

        toast.promise(archivePromise, {
            loading: 'Archiving workflow...',
            success: 'Workflow archived successfully!',
            error: (err) => `Failed to archive: ${err.message}`,
        })
    }

    const handleUnarchive = async () => {
        setIsOpen(false)
        const unarchivePromise = fetchAPI(`/flows/${flow.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'draft' })
        }).then(() => {
            onAction()
        })

        toast.promise(unarchivePromise, {
            loading: 'Unarchiving workflow...',
            success: 'Workflow unarchived successfully!',
            error: (err) => `Failed to unarchive: ${err.message}`,
        })
    }

    const handleDelete = async () => {
        setIsOpen(false)
        // Custom confirmation toast
        toast((t) => (
            <div className="flex flex-col gap-3">
                <div>
                    <p className="font-semibold">Delete "{flow.name}"?</p>
                    <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600"
                        onClick={async () => {
                            toast.dismiss(t.id)
                            const deletePromise = fetchAPI(`/flows/${flow.id}`, { method: 'DELETE' })
                                .then(() => {
                                    onAction()
                                })

                            toast.promise(deletePromise, {
                                loading: 'Deleting workflow...',
                                success: 'Workflow deleted successfully!',
                                error: (err) => `Failed to delete: ${err.message}`,
                            })
                        }}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        ), {
            duration: Infinity,
        })
    }

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                }}
            >
                <FiMoreVertical className="w-4 h-4" />
            </Button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 glass rounded-lg shadow-lg border border-border/40 z-20 overflow-hidden">
                        <button
                            onClick={handleEdit}
                            className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-2 transition-colors"
                        >
                            <FiEdit className="w-4 h-4" />
                            <span>Edit</span>
                        </button>
                        
                        {/* Status Actions */}
                        {flow.status === 'draft' && (
                            <button
                                onClick={handlePublish}
                                className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-2 transition-colors text-green-500"
                            >
                                <FiPlay className="w-4 h-4" />
                                <span>Publish</span>
                            </button>
                        )}
                        {flow.status === 'published' && (
                            <button
                                onClick={handleUnpublish}
                                className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-2 transition-colors"
                            >
                                <FiEdit className="w-4 h-4" />
                                <span>Unpublish</span>
                            </button>
                        )}
                        
                        <button
                            onClick={handleDuplicate}
                            className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-2 transition-colors"
                        >
                            <FiCopy className="w-4 h-4" />
                            <span>Duplicate</span>
                        </button>
                        
                        {flow.status !== 'archived' ? (
                            <button
                                onClick={handleArchive}
                                className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-2 transition-colors"
                            >
                                <FiArchive className="w-4 h-4" />
                                <span>Archive</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleUnarchive}
                                className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-2 transition-colors text-green-500"
                            >
                                <FiArchive className="w-4 h-4" />
                                <span>Unarchive</span>
                            </button>
                        )}
                        
                        <div className="border-t border-border/40" />
                        <button
                            onClick={handleDelete}
                            className="w-full px-4 py-2 text-left hover:bg-red-500/10 text-red-500 flex items-center gap-2 transition-colors"
                        >
                            <FiTrash2 className="w-4 h-4" />
                            <span>Delete</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

export default function WorkflowsPage() {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
    const [flows, setFlows] = useState<Flow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showN8NTemplates, setShowN8NTemplates] = useState(false)

    const loadFlows = useCallback(async () => {
        try {
            setLoading(true)
            const data = await fetchAPI('/flows/')
            const mappedData = (data as any[]).map((flow) => ({
                ...flow,
                // Use status from API if available, otherwise derive from is_active
                status: flow.status || (flow.is_active ? 'published' : 'draft'),
                executions: 0,
                successRate: 0,
                version: flow.version || 1
            }))
            setFlows(mappedData)
            setError(null)
        } catch (err: unknown) {
            console.error('Failed to load flows:', err)
            setError('Failed to load workflows. Please check your connection.')
            setFlows([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadFlows()
    }, [loadFlows])

    const filteredFlows = flows.filter(flow => {
        // Search filter
        const matchesSearch = flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (flow.description && flow.description.toLowerCase().includes(searchQuery.toLowerCase()))
        
        // Status filter
        const matchesStatus = statusFilter === 'all' || flow.status === statusFilter
        
        return matchesSearch && matchesStatus
    })

    // Calculate stats
    const stats = {
        total: flows.length,
        active: flows.filter(f => f.status === 'published').length,
        draft: flows.filter(f => f.status === 'draft').length,
        archived: flows.filter(f => f.status === 'archived').length,
        successRate: 0,
        avgDuration: 0
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Workflows</h1>
                    <p className="text-muted-foreground">
                        Manage and monitor your automation workflows
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowN8NTemplates(true)}
                    >
                        🎬 N8N Templates
                    </Button>
                    <Link href="/flows/new/edit">
                        <Button>
                            <FiPlus className="w-4 h-4 mr-2" />
                            Create Workflow
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <WorkflowStats stats={stats} />

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <SearchBar onSearch={setSearchQuery} />
                </div>
                <div className="flex items-center gap-2">
                    {/* Status Filter */}
                    <div className="glass rounded-lg p-1 flex items-center gap-1">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                statusFilter === 'all' 
                                    ? 'bg-primary text-white' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            All ({stats.total})
                        </button>
                        <button
                            onClick={() => setStatusFilter('draft')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                statusFilter === 'draft' 
                                    ? 'bg-yellow-500 text-white' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Draft ({stats.draft})
                        </button>
                        <button
                            onClick={() => setStatusFilter('published')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                statusFilter === 'published' 
                                    ? 'bg-green-500 text-white' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Published ({stats.active})
                        </button>
                        <button
                            onClick={() => setStatusFilter('archived')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                statusFilter === 'archived' 
                                    ? 'bg-orange-500 text-white' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Archived ({stats.archived})
                        </button>
                    </div>
                    
                    {/* View Mode Toggle */}
                    <div className="glass p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <FiGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <FiList className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <FiLoader className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="text-center py-20 text-red-500">
                    {error}
                    <Button variant="outline" onClick={loadFlows} className="ml-4">Retry</Button>
                </div>
            ) : filteredFlows.length === 0 ? (
                <div className="text-center py-20 glass rounded-xl">
                    <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQuery ? 'Try adjusting your search terms' : 'Create your first workflow to get started'}
                    </p>
                    {!searchQuery && (
                        <Link href="/flows/new/edit">
                            <Button>Create Workflow</Button>
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredFlows.map((flow) => (
                                <WorkflowCard key={flow.id} workflow={flow} onUpdate={loadFlows} />
                            ))}
                        </div>
                    ) : (
                        <div className="glass rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Last Run</th>
                                        <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFlows.map((flow) => (
                                        <tr key={flow.id} className="border-t border-border/40 hover:bg-muted/20">
                                            <td className="p-4">
                                                <Link href={`/flows/${flow.id}`} className="block">
                                                    <div className="font-medium">{flow.name}</div>
                                                    <div className="text-sm text-muted-foreground">{flow.description}</div>
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                                    flow.status === 'published'
                                                        ? 'bg-green-500/10 text-green-500'
                                                        : flow.status === 'archived'
                                                        ? 'bg-orange-500/10 text-orange-500'
                                                        : 'bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                    {flow.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {flow.updated_at ? new Date(flow.updated_at).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <FiPlay className="w-4 h-4" />
                                                    </Button>
                                                    <FlowDropdownMenu flow={flow} onAction={loadFlows} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
            
            {/* N8N Template Selector */}
            {showN8NTemplates && (
                <N8NTemplateSelector
                    onSelect={(templateData) => {
                        console.log('Template selected:', templateData)
                        
                        // Close modal first
                        setShowN8NTemplates(false)
                        
                        // Save template data to localStorage
                        try {
                            localStorage.setItem('n8n_template_data', JSON.stringify(templateData))
                            console.log('Template saved to localStorage')
                            
                            // Small delay to ensure localStorage is written
                            setTimeout(() => {
                                // Navigate to new flow editor
                                router.push('/flows/new/edit?from=template')
                            }, 100)
                        } catch (e) {
                            console.error('Failed to save template:', e)
                            toast.error('Failed to save template')
                        }
                    }}
                    onClose={() => setShowN8NTemplates(false)}
                />
            )}
        </div>
    )
}
